import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import type { FileMeta } from '@storage-invaders/shared';

describe('Server API Routes (/healthz and /api/analyze)', () => {
  it('GET /healthz returns 200 with status ok and timestamp', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('POST /api/analyze triages valid FileMeta batch successfully', async () => {
    const validBatch: FileMeta[] = [
      {
        id: 'test-f1',
        name: 'Tax_Return_2025.pdf',
        mimeType: 'application/pdf',
        size: 1048576,
        modifiedTime: '2025-01-01T00:00:00Z',
      },
      {
        id: 'test-f2',
        name: 'ChromeSetup.exe',
        mimeType: 'application/x-msdownload',
        size: 50485760,
        modifiedTime: '2023-01-01T00:00:00Z',
      },
    ];

    const res = await request(app)
      .post('/api/analyze')
      .send({ files: validBatch });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.analyses)).toBe(true);
    expect(res.body.analyses.length).toBe(2);
    expect(['gemini', 'heuristic']).toContain(res.body.source);

    const taxAnalysis = res.body.analyses.find((a: { id: string }) => a.id === 'test-f1');
    expect(taxAnalysis).toBeDefined();
    expect(taxAnalysis.verdict).toBe('keep');
  });

  it('POST /api/analyze rejects oversized payload (> 25 files) with HTTP 400', async () => {
    const oversized = Array.from({ length: 26 }, (_, i) => ({
      id: `file-${i}`,
      name: `file_${i}.tmp`,
      mimeType: 'application/octet-stream',
      size: 1000,
      modifiedTime: '2023-01-01T00:00:00Z',
    }));

    const res = await request(app)
      .post('/api/analyze')
      .send({ files: oversized });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('too many files');
  });

  it('POST /api/analyze rejects invalid / malformed payload with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ invalid: 'payload' });

    expect(res.status).toBe(400);
  });
});
