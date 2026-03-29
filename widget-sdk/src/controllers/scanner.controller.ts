import { ApiRequestError, type OcrResponse } from './ai.controller.ts';

const baseUrl =
  import.meta.env.VITE_MULTIMODAL_API_BASE?.replace(/\/$/, '') ?? 'http://localhost:8787';

export async function ocrFromImageUrl(imageUrl: string, prompt?: string): Promise<OcrResponse> {
  const response = await fetch(`${baseUrl}/v1/ocr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageUrl,
      prompt
    })
  });

  const payload = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof payload.error === 'string' ? payload.error : 'OCR request failed.';
    const requestId = typeof payload.requestId === 'string' ? payload.requestId : undefined;
    throw new ApiRequestError(message, requestId);
  }

  return payload as unknown as OcrResponse;
}
