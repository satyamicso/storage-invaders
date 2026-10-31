import type { FileMeta, ActionResult } from '@storage-invaders/shared';
import type { FileProvider } from '../providers/types';

export type ActionStatus =
  | 'pending' // In 5-second undo grace window
  | 'committing' // Sent to provider
  | 'confirmed' // Successfully trashed
  | 'rolled_back' // Cancelled by user undo
  | 'restoring' // Restore in progress
  | 'restored' // Restored back to active
  | 'failed'; // Provider error

export interface QueuedAction {
  id: string;
  file: FileMeta;
  status: ActionStatus;
  createdAt: number;
  undoExpiresAt: number;
  timerId?: ReturnType<typeof setTimeout>;
  error?: string;
}

export type QueueEventListener = (action: QueuedAction) => void;

export class ActionQueue {
  private provider: FileProvider;
  private actions: Map<string, QueuedAction> = new Map();
  private listeners: Set<QueueEventListener> = new Set();
  private onConfirmCallback?: (file: FileMeta) => void;
  private onRollbackCallback?: (file: FileMeta) => void;
  private onRestoreCallback?: (file: FileMeta) => void;
  private undoWindowMs = 5000;

  constructor(provider: FileProvider, undoWindowMs = 5000) {
    this.provider = provider;
    this.undoWindowMs = undoWindowMs;
  }

  public setProvider(provider: FileProvider): void {
    this.provider = provider;
  }

  public onConfirm(cb: (file: FileMeta) => void): void {
    this.onConfirmCallback = cb;
  }

  public onRollback(cb: (file: FileMeta) => void): void {
    this.onRollbackCallback = cb;
  }

  public onRestore(cb: (file: FileMeta) => void): void {
    this.onRestoreCallback = cb;
  }

  public subscribe(listener: QueueEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(action: QueuedAction): void {
    for (const listener of this.listeners) {
      try {
        listener(action);
      } catch (err) {
        console.error('Queue listener error:', err);
      }
    }
  }

  /**
   * Enqueue file for trashing with optimistic pending state and 5s undo window.
   */
  public enqueueTrash(file: FileMeta): QueuedAction {
    // If already in queue, cancel prior timer if pending
    const existing = this.actions.get(file.id);
    if (existing && existing.timerId) {
      clearTimeout(existing.timerId);
    }

    const now = Date.now();
    const action: QueuedAction = {
      id: file.id,
      file,
      status: 'pending',
      createdAt: now,
      undoExpiresAt: now + this.undoWindowMs,
    };

    action.timerId = setTimeout(() => {
      this.commitTrash(action);
    }, this.undoWindowMs);

    this.actions.set(file.id, action);
    this.notify(action);
    return action;
  }

  /**
   * Undo a pending trash action within the 5s window.
   */
  public undo(id: string): boolean {
    const action = this.actions.get(id);
    if (!action || action.status !== 'pending') {
      return false;
    }

    if (action.timerId) {
      clearTimeout(action.timerId);
      action.timerId = undefined;
    }

    action.status = 'rolled_back';
    this.notify(action);

    if (this.onRollbackCallback) {
      this.onRollbackCallback(action.file);
    }

    return true;
  }

  /**
   * Commit the trash action to the provider after undo window expires.
   */
  private async commitTrash(action: QueuedAction): Promise<void> {
    action.status = 'committing';
    action.timerId = undefined;
    this.notify(action);

    try {
      const results: ActionResult[] = await this.provider.trash([action.id]);
      const result = results.find((r) => r.id === action.id);

      if (result && result.success) {
        action.status = 'confirmed';
        this.notify(action);

        if (this.onConfirmCallback) {
          this.onConfirmCallback(action.file);
        }
      } else {
        action.status = 'failed';
        action.error = result?.error || 'Failed to move file to trash.';
        this.notify(action);

        if (this.onRollbackCallback) {
          this.onRollbackCallback(action.file);
        }
      }
    } catch (err) {
      action.status = 'failed';
      action.error = err instanceof Error ? err.message : 'Network error during trash.';
      this.notify(action);

      if (this.onRollbackCallback) {
        this.onRollbackCallback(action.file);
      }
    }
  }

  /**
   * Restore a previously confirmed trashed file back from the Trash Bay.
   */
  public async restore(id: string): Promise<boolean> {
    const action = this.actions.get(id);
    if (!action || action.status !== 'confirmed') {
      return false;
    }

    action.status = 'restoring';
    this.notify(action);

    try {
      const results = await this.provider.restore([id]);
      const res = results.find((r) => r.id === id);

      if (res && res.success) {
        action.status = 'restored';
        this.notify(action);

        if (this.onRestoreCallback) {
          this.onRestoreCallback(action.file);
        }
        return true;
      } else {
        action.status = 'confirmed'; // Revert back to confirmed
        action.error = res?.error || 'Failed to restore file.';
        this.notify(action);
        return false;
      }
    } catch (err) {
      action.status = 'confirmed';
      action.error = err instanceof Error ? err.message : 'Network error during restore.';
      this.notify(action);
      return false;
    }
  }

  /**
   * Restore all currently confirmed files.
   */
  public async restoreAll(): Promise<number> {
    const confirmedActions = Array.from(this.actions.values()).filter(
      (a) => a.status === 'confirmed'
    );
    if (confirmedActions.length === 0) return 0;

    const ids = confirmedActions.map((a) => a.id);
    try {
      const results = await this.provider.restore(ids);
      let count = 0;

      for (const res of results) {
        if (res.success) {
          const act = this.actions.get(res.id);
          if (act) {
            act.status = 'restored';
            count++;
            this.notify(act);
            if (this.onRestoreCallback) {
              this.onRestoreCallback(act.file);
            }
          }
        }
      }
      return count;
    } catch (err) {
      console.error('Failed to restore all:', err);
      return 0;
    }
  }

  public getPendingActions(): QueuedAction[] {
    return Array.from(this.actions.values()).filter((a) => a.status === 'pending');
  }

  public getConfirmedActions(): QueuedAction[] {
    return Array.from(this.actions.values()).filter((a) => a.status === 'confirmed');
  }

  public getAllActions(): QueuedAction[] {
    return Array.from(this.actions.values());
  }

  public clear(): void {
    for (const a of this.actions.values()) {
      if (a.timerId) {
        clearTimeout(a.timerId);
      }
    }
    this.actions.clear();
  }
}
