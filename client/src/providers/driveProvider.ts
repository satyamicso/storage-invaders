import type { FileMeta, ActionResult } from '@storage-invaders/shared';
import type { FileProvider } from './types';

export class DriveProvider implements FileProvider {
  public readonly mode = 'drive' as const;

  public async listCandidates(limit = 60): Promise<FileMeta[]> {
    const res = await fetch(`/api/drive/candidates?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.status === 401) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'UNAUTHORIZED_DRIVE_SESSION');
    }

    if (!res.ok) {
      throw new Error(`Failed to load Google Drive files: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  }

  public async trash(ids: string[]): Promise<ActionResult[]> {
    const res = await fetch('/api/drive/trash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED_DRIVE_SESSION');
    }

    if (!res.ok) {
      return ids.map((id) => ({
        id,
        success: false,
        trashed: false,
        error: `Server responded with HTTP ${res.status}`,
      }));
    }

    const data = await res.json();
    return data.results || [];
  }

  public async restore(ids: string[]): Promise<ActionResult[]> {
    const res = await fetch('/api/drive/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED_DRIVE_SESSION');
    }

    if (!res.ok) {
      return ids.map((id) => ({
        id,
        success: false,
        trashed: true,
        error: `Server responded with HTTP ${res.status}`,
      }));
    }

    const data = await res.json();
    return data.results || [];
  }
}
