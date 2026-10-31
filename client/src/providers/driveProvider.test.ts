import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriveProvider } from './driveProvider';
import type { FileMeta } from '@storage-invaders/shared';

describe('DriveProvider Contract Tests (Mocked API)', () => {
  let provider: DriveProvider;

  beforeEach(() => {
    provider = new DriveProvider();
    vi.restoreAllMocks();
  });

  it('identifies mode as drive', () => {
    expect(provider.mode).toBe('drive');
  });

  it('fetches candidate files from /api/drive/candidates', async () => {
    const mockFiles: FileMeta[] = [
      {
        id: 'real-f1',
        name: 'Large_Archive.zip',
        mimeType: 'application/zip',
        size: 524288000,
        modifiedTime: '2024-01-01T00:00:00Z',
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ files: mockFiles }),
      })
    );

    const candidates = await provider.listCandidates(20);
    expect(candidates).toEqual(mockFiles);
    expect(fetch).toHaveBeenCalledWith(
      '/api/drive/candidates?limit=20',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('submits trash requests to /api/drive/trash', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          results: [{ id: 'real-f1', success: true, trashed: true }],
        }),
      })
    );

    const results = await provider.trash(['real-f1']);
    expect(results.length).toBe(1);
    expect(results[0].success).toBe(true);
    expect(results[0].trashed).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      '/api/drive/trash',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ids: ['real-f1'] }),
      })
    );
  });

  it('submits restore requests to /api/drive/restore', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          results: [{ id: 'real-f1', success: true, trashed: false }],
        }),
      })
    );

    const results = await provider.restore(['real-f1']);
    expect(results.length).toBe(1);
    expect(results[0].success).toBe(true);
    expect(results[0].trashed).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      '/api/drive/restore',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ids: ['real-f1'] }),
      })
    );
  });

  it('throws UNAUTHORIZED_DRIVE_SESSION on HTTP 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'UNAUTHORIZED_DRIVE_SESSION' }),
      })
    );

    await expect(provider.listCandidates(10)).rejects.toThrow(
      'UNAUTHORIZED_DRIVE_SESSION'
    );
  });
});
