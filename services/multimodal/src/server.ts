import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { ocrWithAlem, transcribeWithAlem } from './clients/alem.client.js';
import type { CacheStore } from './cache/cache-store.js';
import { MemoryTTLStore } from './cache/memory-ttl-store.js';
import { hashBuffer, hashText, newRequestId } from './lib/crypto.js';

type LanguageHint = 'kk' | 'en' | 'auto';
type HealthState = 'ready' | 'degraded';

type CachedResponse = {
  text: string;
  provider: string;
  language?: string;
  debug?: DebugMeta;
};

type DebugMeta = {
  selectedProvider: string;
  candidatesTried: string[];
  selectionReason: string;
  retryCount: number;
};

type TranscribeDecision = {
  text: string;
  provider: 'speech-to-text-kk' | 'speech-to-text';
  language: string;
  debug: DebugMeta;
};

const OCR_CACHE_VERSION = 'ocr:v3';
const STT_CACHE_VERSION = 'stt:v2';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json({ limit: '5mb' }));

const cache: CacheStore = new MemoryTTLStore();

const config = {
  port: Number(process.env.PORT ?? 8787),
  baseUrl: process.env.ALEM_BASE_URL ?? 'https://llm.alem.ai',
  sttKkKey: process.env.STT_KK_KEY,
  sttGenericKey: process.env.STT_GENERIC_KEY,
  ocrKey: process.env.OCR_KEY,
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 600),
  debugMetadata: process.env.DEBUG_METADATA === '1' || process.env.NODE_ENV !== 'production'
};

app.get('/health', (_req, res) => {
  const stt: HealthState = config.sttKkKey && config.sttGenericKey ? 'ready' : 'degraded';
  const ocr: HealthState = config.ocrKey ? 'ready' : 'degraded';

  res.json({
    ok: stt === 'ready' && ocr === 'ready',
    stt,
    ocr
  });
});

app.post('/v1/transcribe', upload.single('audio'), async (req, res) => {
  const startedAt = Date.now();
  const requestId = newRequestId();

  try {
    if (!config.sttKkKey || !config.sttGenericKey) {
      return res.status(503).json({ error: 'STT is not configured on server.', requestId });
    }

    const audio = req.file;
    if (!audio) {
      return res.status(400).json({ error: 'Audio file is required under field "audio".', requestId });
    }

    const languageHint = normalizeLanguageHint(req.body.languageHint);
    const hash = hashBuffer(audio.buffer);
    const cacheKey = `${STT_CACHE_VERSION}:${hashText(`${hash}:${languageHint}`)}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedResponse;
      const payload = {
        text: parsed.text,
        language: parsed.language ?? languageHint,
        provider: parsed.provider,
        latencyMs: Date.now() - startedAt,
        requestId,
        cacheHit: true,
        ...(config.debugMetadata && parsed.debug ? { debug: parsed.debug } : {})
      };

      logEvent('stt_success', {
        requestId,
        provider: payload.provider,
        language: payload.language,
        cacheHit: true,
        latencyMs: payload.latencyMs
      });

      return res.json(payload);
    }

    const decision = await transcribeWithRouting(languageHint, {
      audio: audio.buffer,
      mimeType: audio.mimetype || 'audio/wav',
      fileName: audio.originalname || 'recording.wav'
    });

    const responseBody = {
      text: decision.text,
      language: decision.language,
      provider: decision.provider,
      latencyMs: Date.now() - startedAt,
      requestId,
      cacheHit: false,
      ...(config.debugMetadata ? { debug: decision.debug } : {})
    };

    await cache.set(
      cacheKey,
      JSON.stringify({
        text: responseBody.text,
        language: responseBody.language,
        provider: responseBody.provider,
        debug: decision.debug
      }),
      config.cacheTtlSeconds
    );

    logEvent('stt_success', {
      requestId,
      provider: responseBody.provider,
      language: responseBody.language,
      cacheHit: false,
      selectionReason: decision.debug.selectionReason,
      candidatesTried: decision.debug.candidatesTried,
      latencyMs: responseBody.latencyMs
    });

    return res.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown transcribe error';
    logEvent('stt_error', { requestId, error: message });
    return res.status(500).json({ error: 'Failed to transcribe audio. Please retry.', requestId });
  }
});

app.post('/v1/ocr', async (req, res) => {
  const startedAt = Date.now();
  const requestId = newRequestId();

  try {
    if (!config.ocrKey) {
      return res.status(503).json({ error: 'OCR is not configured on server.', requestId });
    }

    const promptBase = typeof req.body.prompt === 'string' && req.body.prompt.trim().length > 0
      ? req.body.prompt.trim()
      : 'Extract all visible text from this image. Return only text from the image.';
    const prompt = `${promptBase} Preserve the original language and script exactly. Do not translate.`;

    const imageUrlRaw = typeof req.body.imageUrl === 'string' ? req.body.imageUrl : '';
    const imageUrl = imageUrlRaw.trim();

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required for OCR.', requestId });
    }

    const urlValidation = validateImageUrl(imageUrl);
    if (!urlValidation.ok) {
      return res.status(400).json({ error: urlValidation.error, requestId });
    }

    const cacheKey = `${OCR_CACHE_VERSION}:${hashText(`${imageUrl}:${prompt}:deepseek-ocr`)}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      const parsed = JSON.parse(cached) as CachedResponse;
      const payload = {
        text: parsed.text,
        provider: parsed.provider,
        latencyMs: Date.now() - startedAt,
        requestId,
        cacheHit: true,
        ...(config.debugMetadata && parsed.debug ? { debug: parsed.debug } : {})
      };

      logEvent('ocr_success', {
        requestId,
        provider: payload.provider,
        cacheHit: true,
        latencyMs: payload.latencyMs
      });

      return res.json(payload);
    }

    const fetchedImage = await fetchImageAsDataUrl(imageUrl);
    if (!fetchedImage.ok) {
      logEvent('ocr_rejected', { requestId, reason: fetchedImage.errorReason, imageUrl });
      return res.status(400).json({ error: fetchedImage.userMessage, requestId });
    }

    const ocrDecision = await runOcrWithRetry(fetchedImage.dataUrl, prompt);
    if (!ocrDecision.text) {
      logEvent('ocr_rejected', { requestId, reason: ocrDecision.reason, retryCount: ocrDecision.retryCount });
      return res.status(422).json({ error: 'OCR could not extract reliable text from this image.', requestId });
    }

    const responseBody = {
      text: ocrDecision.text,
      provider: 'deepseek-ocr',
      latencyMs: Date.now() - startedAt,
      requestId,
      cacheHit: false,
      ...(config.debugMetadata
        ? {
            debug: {
              selectedProvider: 'deepseek-ocr',
              candidatesTried: ['deepseek-ocr-attempt-1', 'deepseek-ocr-attempt-2'].slice(0, ocrDecision.retryCount + 1),
              selectionReason: ocrDecision.reason,
              retryCount: ocrDecision.retryCount
            }
          }
        : {})
    };

    await cache.set(
      cacheKey,
      JSON.stringify({
        text: responseBody.text,
        provider: responseBody.provider,
        debug: config.debugMetadata
          ? {
              selectedProvider: 'deepseek-ocr',
              candidatesTried: ['deepseek-ocr-attempt-1', 'deepseek-ocr-attempt-2'].slice(0, ocrDecision.retryCount + 1),
              selectionReason: ocrDecision.reason,
              retryCount: ocrDecision.retryCount
            }
          : undefined
      }),
      config.cacheTtlSeconds
    );

    logEvent('ocr_success', {
      requestId,
      provider: responseBody.provider,
      cacheHit: false,
      retryCount: ocrDecision.retryCount,
      selectionReason: ocrDecision.reason,
      latencyMs: responseBody.latencyMs
    });

    return res.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OCR error';
    logEvent('ocr_error', { requestId, error: message });
    return res.status(500).json({ error: 'OCR request failed. Please retry with a direct image URL.', requestId });
  }
});

app.listen(config.port, () => {
  const readiness = validateConfig();

  if (!readiness.ok) {
    console.warn(`[multimodal] Started with degraded config: ${readiness.missing.join(', ')}`);
  }

  console.log(`[multimodal] Listening on http://localhost:${config.port}`);
});

function normalizeLanguageHint(value: unknown): LanguageHint {
  if (value === 'kk' || value === 'en' || value === 'auto') {
    return value;
  }
  return 'auto';
}

async function transcribeWithRouting(
  languageHint: LanguageHint,
  input: { audio: Buffer; mimeType: string; fileName: string }
): Promise<TranscribeDecision> {
  if (languageHint === 'en') {
    const english = await transcribeWithAlem({
      apiKey: config.sttGenericKey as string,
      baseUrl: config.baseUrl,
      model: 'speech-to-text',
      audio: input.audio,
      mimeType: input.mimeType,
      fileName: input.fileName,
      language: 'en'
    });

    return {
      text: english,
      provider: 'speech-to-text',
      language: 'en',
      debug: {
        selectedProvider: 'speech-to-text',
        candidatesTried: ['speech-to-text:en'],
        selectionReason: 'explicit_en_hint',
        retryCount: 0
      }
    };
  }

  if (languageHint === 'kk') {
    const kazakh = await transcribeWithAlem({
      apiKey: config.sttKkKey as string,
      baseUrl: config.baseUrl,
      model: 'speech-to-text-kk',
      audio: input.audio,
      mimeType: input.mimeType,
      fileName: input.fileName
    });

    return {
      text: kazakh,
      provider: 'speech-to-text-kk',
      language: 'kk',
      debug: {
        selectedProvider: 'speech-to-text-kk',
        candidatesTried: ['speech-to-text-kk'],
        selectionReason: 'explicit_kk_hint',
        retryCount: 0
      }
    };
  }

  const tried: string[] = [];

  try {
    tried.push('speech-to-text-kk');
    const kazakh = await transcribeWithAlem({
      apiKey: config.sttKkKey as string,
      baseUrl: config.baseUrl,
      model: 'speech-to-text-kk',
      audio: input.audio,
      mimeType: input.mimeType,
      fileName: input.fileName
    });

    const kkQuality = assessKazakhCandidate(kazakh);
    if (kkQuality.accept && kkQuality.hasKazakhMarkers) {
      return {
        text: kazakh,
        provider: 'speech-to-text-kk',
        language: 'kk',
        debug: {
          selectedProvider: 'speech-to-text-kk',
          candidatesTried: tried,
          selectionReason: 'kk_markers_detected',
          retryCount: 0
        }
      };
    }

    tried.push('speech-to-text:en');
    const genericEnglish = await transcribeWithAlem({
      apiKey: config.sttGenericKey as string,
      baseUrl: config.baseUrl,
      model: 'speech-to-text',
      audio: input.audio,
      mimeType: input.mimeType,
      fileName: input.fileName,
      language: 'en'
    });

    const genericQuality = assessGenericCandidate(genericEnglish);
    if (genericQuality.accept && genericQuality.languageGuess === 'en') {
      return {
        text: genericEnglish,
        provider: 'speech-to-text',
        language: 'en',
        debug: {
          selectedProvider: 'speech-to-text',
          candidatesTried: tried,
          selectionReason: 'latin_text_detected_after_kk_probe',
          retryCount: 1
        }
      };
    }

    if (kkQuality.accept) {
      return {
        text: kazakh,
        provider: 'speech-to-text-kk',
        language: 'kk',
        debug: {
          selectedProvider: 'speech-to-text-kk',
          candidatesTried: tried,
          selectionReason: `generic_not_english:${genericQuality.reason}`,
          retryCount: 1
        }
      };
    }

    if (genericQuality.accept) {
      return {
        text: genericEnglish,
        provider: 'speech-to-text',
        language: genericQuality.languageGuess,
        debug: {
          selectedProvider: 'speech-to-text',
          candidatesTried: tried,
          selectionReason: `kk_rejected:${kkQuality.reason}`,
          retryCount: 1
        }
      };
    }
  } catch {
    // Continue to fallback path.
  }

  tried.push('speech-to-text:auto');
  const genericAuto = await transcribeWithAlem({
    apiKey: config.sttGenericKey as string,
    baseUrl: config.baseUrl,
    model: 'speech-to-text',
    audio: input.audio,
    mimeType: input.mimeType,
    fileName: input.fileName
  });

  return {
    text: genericAuto,
    provider: 'speech-to-text',
    language: 'auto',
    debug: {
      selectedProvider: 'speech-to-text',
      candidatesTried: tried,
      selectionReason: 'fallback_generic_auto',
      retryCount: Math.max(0, tried.length - 1)
    }
  };
}

function assessGenericCandidate(text: string): { accept: boolean; reason: string; languageGuess: string } {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/g).filter(Boolean);

  if (!trimmed || words.length === 0) {
    return { accept: false, reason: 'empty', languageGuess: 'unknown' };
  }

  if (trimmed.length < 3) {
    return { accept: false, reason: 'too_short', languageGuess: 'unknown' };
  }

  const latinCount = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  const cyrillicCount = (trimmed.match(/[\u0400-\u04FF]/g) ?? []).length;

  if (latinCount === 0 && cyrillicCount > 0) {
    return { accept: false, reason: 'non_latin_detected', languageGuess: 'cyrillic' };
  }

  if (latinCount >= 2 && words.length >= 1) {
    return { accept: true, reason: 'latin_text_detected', languageGuess: 'en' };
  }

  if (cyrillicCount > 0 && latinCount > 0) {
    return { accept: true, reason: 'mixed_script_text_detected', languageGuess: 'mixed' };
  }

  return { accept: true, reason: 'generic_text_detected', languageGuess: 'auto' };
}

function assessKazakhCandidate(text: string): { accept: boolean; reason: string; hasKazakhMarkers: boolean } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { accept: false, reason: 'empty', hasKazakhMarkers: false };
  }

  if (trimmed.length < 2) {
    return { accept: false, reason: 'too_short', hasKazakhMarkers: false };
  }

  const hasKazakhMarkers = /[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/.test(trimmed);
  return { accept: true, reason: 'kk_candidate_ok', hasKazakhMarkers };
}

function validateImageUrl(raw: string): { ok: true } | { ok: false; error: string } {
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: 'imageUrl must be a valid URL.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'imageUrl must start with http:// or https://.' };
  }

  return { ok: true };
}

async function fetchImageAsDataUrl(
  imageUrl: string
): Promise<{ ok: true; dataUrl: string } | { ok: false; errorReason: string; userMessage: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        ok: false,
        errorReason: `fetch_status_${response.status}`,
        userMessage: 'Could not fetch image URL. Please provide a direct public image link.'
      };
    }

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (contentType && !contentType.startsWith('image/')) {
      return {
        ok: false,
        errorReason: `non_image_content_type:${contentType}`,
        userMessage: 'URL does not point to an image resource.'
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return {
        ok: false,
        errorReason: 'empty_image_payload',
        userMessage: 'Image URL returned empty content.'
      };
    }

    const mimeType = contentType || 'image/png';
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      ok: true,
      dataUrl: `data:${mimeType};base64,${base64}`
    };
  } catch {
    return {
      ok: false,
      errorReason: 'fetch_failed',
      userMessage: 'Failed to fetch image URL. Check that the link is public and direct.'
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runOcrWithRetry(
  imageDataUrl: string,
  firstPrompt: string
): Promise<{ text: string; retryCount: number; reason: string }> {
  const prompts = [
    firstPrompt,
    'Extract only text visible in the image. Preserve original language/script exactly. Output text only. Do not translate. If no text is visible, output NO_TEXT.'
  ];

  for (let index = 0; index < prompts.length; index += 1) {
    const raw = await ocrWithAlem({
      apiKey: config.ocrKey as string,
      baseUrl: config.baseUrl,
      imageUrl: imageDataUrl,
      prompt: prompts[index]
    });

    const normalized = normalizeOcrText(raw, prompts[index]);
    if (normalized.accept) {
      return {
        text: normalized.text,
        retryCount: index,
        reason: index === 0 ? 'primary_prompt' : 'fallback_prompt'
      };
    }
  }

  return {
    text: '',
    retryCount: 1,
    reason: 'echo_or_empty_after_retry'
  };
}

function normalizeOcrText(input: string, prompt: string): { accept: boolean; text: string } {
  const text = input.trim();
  if (!text) {
    return { accept: false, text: '' };
  }

  const stripped = stripPromptEcho(text, prompt).trim();
  if (!stripped) {
    return { accept: false, text: '' };
  }

  const lowered = stripped.toLowerCase();
  if (lowered === 'no_text') {
    return { accept: false, text: '' };
  }

  if (looksLikeInstructionEcho(stripped)) {
    return { accept: false, text: '' };
  }

  return { accept: true, text: stripped };
}

function looksLikeInstructionEcho(text: string): boolean {
  const lowered = text.toLowerCase();

  const highlySuspiciousPatterns = [
    'if the text is not a valid url',
    'return invalid_url',
    'if the text is too long, return long_text',
    'do not repeat this instruction',
    'preserve the original language and script',
    'do not translate'
  ];

  for (const pattern of highlySuspiciousPatterns) {
    if (lowered.includes(pattern)) {
      const occurrences = lowered.split(pattern).length - 1;
      if (occurrences >= 2 || (occurrences >= 1 && lowered.length < 240)) {
        return true;
      }
    }
  }

  const sentences = lowered
    .split(/[.!?\n]+/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length >= 8);

  if (sentences.length < 8) {
    return false;
  }

  const counts = new Map<string, number>();
  for (const sentence of sentences) {
    counts.set(sentence, (counts.get(sentence) ?? 0) + 1);
  }

  let maxRepeat = 0;
  for (const count of counts.values()) {
    if (count > maxRepeat) {
      maxRepeat = count;
    }
  }

  return maxRepeat >= 6 && maxRepeat / sentences.length >= 0.55;
}

function stripPromptEcho(text: string, prompt: string): string {
  const promptLower = prompt.toLowerCase();
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanedLines = lines.filter((line) => {
    const lowered = line.toLowerCase();
    if (lowered.length >= 8 && promptLower.includes(lowered)) {
      return false;
    }
    return true;
  });

  return cleanedLines.join('\n').trim();
}

function validateConfig(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!config.sttKkKey) {
    missing.push('STT_KK_KEY');
  }
  if (!config.sttGenericKey) {
    missing.push('STT_GENERIC_KEY');
  }
  if (!config.ocrKey) {
    missing.push('OCR_KEY');
  }

  return {
    ok: missing.length === 0,
    missing
  };
}

function logEvent(event: string, details: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...details
    })
  );
}
