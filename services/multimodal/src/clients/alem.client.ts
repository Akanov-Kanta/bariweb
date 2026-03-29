const DEFAULT_TIMEOUT_MS = 25_000;

export type SttProvider = 'speech-to-text-kk' | 'speech-to-text';

export type SttArgs = {
  apiKey: string;
  baseUrl: string;
  model: SttProvider;
  audio: Buffer;
  mimeType: string;
  fileName: string;
  language?: string;
};

export type OcrArgs = {
  apiKey: string;
  baseUrl: string;
  imageUrl: string;
  prompt: string;
};

export async function transcribeWithAlem(args: SttArgs): Promise<string> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(args.audio)], { type: args.mimeType });

  form.append('model', args.model);
  form.append('file', blob, args.fileName);

  if (args.language) {
    form.append('language', args.language);
  }

  const response = await fetchWithTimeout(`${args.baseUrl}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`
    },
    body: form
  });

  if (!response.ok) {
    const details = await safeReadText(response);
    throw new Error(`STT request failed with status ${response.status}${details ? `: ${details}` : ''}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const text = typeof data.text === 'string' ? data.text.trim() : '';

  if (!text) {
    throw new Error('STT provider returned empty text.');
  }

  return text;
}

export async function ocrWithAlem(args: OcrArgs): Promise<string> {
  const response = await fetchWithTimeout(`${args.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-ocr',
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: args.imageUrl
              }
            },
            {
              type: 'text',
              text: args.prompt
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const details = await safeReadText(response);
    throw new Error(`OCR request failed with status ${response.status}${details ? `: ${details}` : ''}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const text = extractCompletionText(data).trim();

  if (!text) {
    throw new Error('OCR provider returned empty text.');
  }

  return text;
}

function extractCompletionText(payload: Record<string, unknown>): string {
  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return '';
  }

  const first = choices[0] as Record<string, unknown>;
  const message = first.message as Record<string, unknown> | undefined;
  const content = message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  const textParts = content
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      const chunk = item as Record<string, unknown>;
      return typeof chunk.text === 'string' ? chunk.text : '';
    })
    .filter(Boolean);

  return textParts.join('\n');
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    const raw = await response.text();
    return raw.trim().slice(0, 500);
  } catch {
    return '';
  }
}
