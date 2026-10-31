import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { cryptoService } from '../services/crypto.js';
import { driveService } from '../services/drive.js';

describe('Drive API Routes & OAuth State Protection', () => {
  const validSession = {
    accessToken: 'mock_valid_access_token_123',
    expiryDate: Date.now() + 3600000,
    email: 'tester@example.com',
  };

  const validCookie = `si_session=${cryptoService.encrypt(validSession)}`;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/drive/candidates returns 401 if unauthenticated', async () => {
    const res = await request(app).get('/api/drive/candidates');
    expect(res.status).toBe(401);
    expect(res.body.reconnect).toBe(true);
  });

  it('GET /api/drive/candidates returns candidates when authenticated with valid cookie', async () => {
    vi.spyOn(driveService, 'listCandidates').mockResolvedValue([
      {
        id: 'real-1',
        name: 'Large_Backup.tar.gz',
        mimeType: 'application/gzip',
        size: 800000000,
        modifiedTime: '2024-01-01T00:00:00Z',
      },
    ]);

    const res = await request(app)
      .get('/api/drive/candidates?limit=20')
      .set('Cookie', validCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.files)).toBe(true);
    expect(res.body.files.length).toBe(1);
    expect(res.body.files[0].id).toBe('real-1');
  });

  it('POST /api/drive/trash rejects oversized batch (> 25 ids) with HTTP 400', async () => {
    const oversizedIds = Array.from({ length: 26 }, (_, i) => `id-${i}`);

    const res = await request(app)
      .post('/api/drive/trash')
      .set('Cookie', validCookie)
      .send({ ids: oversizedIds });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('payload exceeds 25 files');
  });

  it('POST /api/drive/trash executes trash and returns ActionResult array', async () => {
    vi.spyOn(driveService, 'trashFiles').mockResolvedValue([
      { id: 'f-1', success: true, trashed: true },
    ]);

    const res = await request(app)
      .post('/api/drive/trash')
      .set('Cookie', validCookie)
      .send({ ids: ['f-1'] });

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([{ id: 'f-1', success: true, trashed: true }]);
  });

  it('POST /api/drive/restore executes restore and returns ActionResult array', async () => {
    vi.spyOn(driveService, 'restoreFiles').mockResolvedValue([
      { id: 'f-1', success: true, trashed: false },
    ]);

    const res = await request(app)
      .post('/api/drive/restore')
      .set('Cookie', validCookie)
      .send({ ids: ['f-1'] });

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([{ id: 'f-1', success: true, trashed: false }]);
  });

  it('GET /api/auth/me returns user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', validCookie);

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.user.email).toBe('tester@example.com');
  });

  it('GET /api/auth/me returns authenticated: false when cookie is missing', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  it('GET /api/auth/callback triggers CSRF protection and returns 403 on state mismatch', async () => {
    const res = await request(app)
      .get('/api/auth/callback?code=mock_code&state=forged_state')
      .set('Cookie', 'oauth_state=legitimate_state');

    expect(res.status).toBe(403);
    expect(res.text).toContain('OAuth state mismatch');
  });
});
