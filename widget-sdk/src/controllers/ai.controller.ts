export type LanguageHint = 'kk' | 'en' | 'ru' | 'auto';

export type TranscribeResponse = {
  text: string;
  language: string;
  provider: string;
  latencyMs: number;
  requestId: string;
  cacheHit: boolean;
};

export type OcrResponse = {
  text: string;
  provider: string;
  latencyMs: number;
  requestId: string;
  cacheHit: boolean;
};

export class ApiRequestError extends Error {
  readonly requestId?: string;

  constructor(message: string, requestId?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.requestId = requestId;
  }
}

const baseUrl =
  import.meta.env.VITE_MULTIMODAL_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:8787';

export async function transcribeAudio(blob: Blob, languageHint: LanguageHint): Promise<TranscribeResponse> {
  const formData = new FormData();
  const extension = blob.type.includes('wav')
    ? 'wav'
    : blob.type.includes('ogg')
      ? 'ogg'
      : 'webm';

  formData.append('audio', blob, `recording.${extension}`);
  formData.append('languageHint', languageHint);

  const response = await fetch(`${baseUrl}/v1/transcribe`, {
    method: 'POST',
    body: formData
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof payload.error === 'string' ? payload.error : 'Transcribe request failed.';
    const requestId = typeof payload.requestId === 'string' ? payload.requestId : undefined;
    throw new ApiRequestError(message, requestId);
  }

  return payload as unknown as TranscribeResponse;
}
