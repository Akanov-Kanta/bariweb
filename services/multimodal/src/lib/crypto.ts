import { createHash, randomUUID } from 'node:crypto';

export function hashBuffer(input: Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashText(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function newRequestId(): string {
  return randomUUID();
}