import crypto from 'crypto';
import type { FileMeta, Analysis } from '@storage-invaders/shared';

export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, V>;

  constructor(capacity = 500) {
    this.capacity = capacity;
    this.map = new Map();
  }

  public get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // Refresh position to mark as recently used
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  public set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict oldest (first inserted) item
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  public has(key: K): boolean {
    return this.map.has(key);
  }

  public clear(): void {
    this.map.clear();
  }

  public size(): number {
    return this.map.size;
  }

  /**
   * Generates a deterministic SHA-256 fingerprint for a FileMeta object.
   */
  public static hashFileMeta(file: FileMeta): string {
    const raw = `${file.id}:${file.name}:${file.size}:${file.modifiedTime}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}

export const analysisCache = new LRUCache<string, Analysis>(500);
