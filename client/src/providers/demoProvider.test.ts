import { describe, it, expect, beforeEach } from 'vitest';
import { DemoProvider } from './demoProvider';

describe('DemoProvider Contract Tests', () => {
  let provider: DemoProvider;

  beforeEach(() => {
    provider = new DemoProvider(0);
  });

  it('identifies as demo mode', () => {
    expect(provider.mode).toBe('demo');
  });

  it('lists candidates ordered by size descending', async () => {
    const candidates = await provider.listCandidates(20);
    expect(candidates.length).toBe(20);

    for (let i = 0; i < candidates.length - 1; i++) {
      expect(candidates[i].size).toBeGreaterThanOrEqual(candidates[i + 1].size);
    }
  });

  it('marks files as trashed and excludes them from candidate listing', async () => {
    const initialCandidates = await provider.listCandidates(10);
    const targetFile = initialCandidates[0];

    const trashResult = await provider.trash([targetFile.id]);
    expect(trashResult.length).toBe(1);
    expect(trashResult[0].success).toBe(true);
    expect(trashResult[0].trashed).toBe(true);

    const updatedCandidates = await provider.listCandidates(10);
    expect(updatedCandidates.some((f) => f.id === targetFile.id)).toBe(false);
  });

  it('restores trashed files back into candidate pool', async () => {
    const initialCandidates = await provider.listCandidates(5);
    const targetId = initialCandidates[0].id;

    await provider.trash([targetId]);
    expect(provider.isTrashed(targetId)).toBe(true);

    const restoreResult = await provider.restore([targetId]);
    expect(restoreResult[0].success).toBe(true);
    expect(restoreResult[0].trashed).toBe(false);
    expect(provider.isTrashed(targetId)).toBe(false);

    const afterRestore = await provider.listCandidates(5);
    expect(afterRestore.some((f) => f.id === targetId)).toBe(true);
  });
});
