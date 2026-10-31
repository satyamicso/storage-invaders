import type { FileMeta, ActionResult } from '@storage-invaders/shared';

export interface FileProvider {
  readonly mode: 'demo' | 'drive';
  listCandidates(limit?: number): Promise<FileMeta[]>;
  trash(ids: string[]): Promise<ActionResult[]>;
  restore(ids: string[]): Promise<ActionResult[]>;
}
