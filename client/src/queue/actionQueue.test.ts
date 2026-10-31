import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionQueue } from './actionQueue';
import { DemoProvider } from '../providers/demoProvider';
import type { FileMeta } from '@storage-invaders/shared';

describe('ActionQueue (Non-blocking background chore)', () => {
  let provider: DemoProvider;
  let queue: ActionQueue;

  const mockFile: FileMeta = {
    id: 'test-f1',
    name: 'test_large_installer.exe',
    mimeType: 'application/x-msdownload',
    size: 104857600, // 100 MB
    modifiedTime: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    provider = new DemoProvider(0); // 0ms latency for synchronous testing
    queue = new ActionQueue(provider, 5000);
  });

  it('puts new action into pending state immediately (optimistic UI)', () => {
    const action = queue.enqueueTrash(mockFile);
    expect(action.status).toBe('pending');
    expect(queue.getPendingActions().length).toBe(1);
    expect(provider.isTrashed(mockFile.id)).toBe(false);
  });

  it('rolls back action when undone within 5-second window', () => {
    const rollbackCb = vi.fn();
    queue.onRollback(rollbackCb);

    queue.enqueueTrash(mockFile);
    const undone = queue.undo(mockFile.id);

    expect(undone).toBe(true);
    expect(queue.getPendingActions().length).toBe(0);
    expect(rollbackCb).toHaveBeenCalledWith(mockFile);

    // Advance past 5s window to ensure commit does NOT fire
    vi.advanceTimersByTime(6000);
    expect(provider.isTrashed(mockFile.id)).toBe(false);
  });

  it('commits trash to provider after 5-second window elapses', async () => {
    const confirmCb = vi.fn();
    queue.onConfirm(confirmCb);

    queue.enqueueTrash(mockFile);
    expect(queue.getPendingActions().length).toBe(1);

    // Fast-forward past undo window
    await vi.advanceTimersByTimeAsync(5000);

    expect(provider.isTrashed(mockFile.id)).toBe(true);
    expect(confirmCb).toHaveBeenCalledWith(mockFile);
    expect(queue.getConfirmedActions().length).toBe(1);
  });

  it('restores confirmed trashed file back from Trash Bay', async () => {
    const restoreCb = vi.fn();
    queue.onRestore(restoreCb);

    queue.enqueueTrash(mockFile);
    await vi.advanceTimersByTimeAsync(5000); // Commit

    expect(provider.isTrashed(mockFile.id)).toBe(true);

    const restored = await queue.restore(mockFile.id);
    expect(restored).toBe(true);
    expect(provider.isTrashed(mockFile.id)).toBe(false);
    expect(restoreCb).toHaveBeenCalledWith(mockFile);
  });

  it('restores all confirmed files with restoreAll', async () => {
    const file2: FileMeta = {
      id: 'test-f2',
      name: 'dup (1).zip',
      mimeType: 'application/zip',
      size: 50000000,
      modifiedTime: '2023-01-01T00:00:00Z',
    };

    queue.enqueueTrash(mockFile);
    queue.enqueueTrash(file2);
    await vi.advanceTimersByTimeAsync(5000);

    expect(queue.getConfirmedActions().length).toBe(2);
    const restoredCount = await queue.restoreAll();

    expect(restoredCount).toBe(2);
    expect(provider.isTrashed(mockFile.id)).toBe(false);
    expect(provider.isTrashed(file2.id)).toBe(false);
  });
});
