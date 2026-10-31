import type { FileMeta, ActionResult } from '@storage-invaders/shared';
import type { FileProvider } from './types';
import { DEMO_FILES } from './demoFiles';

export class DemoProvider implements FileProvider {
  public readonly mode = 'demo' as const;
  private trashedIds: Set<string> = new Set();
  private simulatedLatencyMs: number;

  constructor(simulatedLatencyMs = 60) {
    this.simulatedLatencyMs = simulatedLatencyMs;
  }

  private async delay(): Promise<void> {
    if (this.simulatedLatencyMs <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));
  }

  public async listCandidates(limit = 60): Promise<FileMeta[]> {
    await this.delay();
    // Return non-trashed files, ordered by size descending
    const candidates = DEMO_FILES.filter((f) => !this.trashedIds.has(f.id))
      .sort((a, b) => b.size - a.size)
      .slice(0, limit)
      .map((f) => ({ ...f, trashed: false }));
    return candidates;
  }

  public async trash(ids: string[]): Promise<ActionResult[]> {
    await this.delay();
    const results: ActionResult[] = [];

    for (const id of ids) {
      this.trashedIds.add(id);
      results.push({
        id,
        success: true,
        trashed: true,
      });
    }

    return results;
  }

  public async restore(ids: string[]): Promise<ActionResult[]> {
    await this.delay();
    const results: ActionResult[] = [];

    for (const id of ids) {
      this.trashedIds.delete(id);
      results.push({
        id,
        success: true,
        trashed: false,
      });
    }

    return results;
  }

  public getTrashedCount(): number {
    return this.trashedIds.size;
  }

  public isTrashed(id: string): boolean {
    return this.trashedIds.has(id);
  }

  public reset(): void {
    this.trashedIds.clear();
  }
}
