import type { CacheStore } from './cache-store.js';

type Entry = {
  value: string;
  expiresAt: number;
};

export class MemoryTTLStore implements CacheStore {
  private readonly data = new Map<string, Entry>();

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.data.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
  }
}