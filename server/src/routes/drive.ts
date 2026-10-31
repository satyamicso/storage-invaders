import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  TrashRequestSchema,
  RestoreRequestSchema,
} from '@storage-invaders/shared';
import { cryptoService } from '../services/crypto.js';
import { driveService } from '../services/drive.js';

export const driveRouter = Router();

// Middleware to authenticate session cookie
interface AuthenticatedRequest extends Request {
  accessToken?: string;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionCookie = req.cookies.si_session as string | undefined;

  if (!sessionCookie) {
    return res.status(401).json({
      error: 'Drive mode requires Google connection. Please connect your Google Drive.',
      reconnect: true,
    });
  }

  try {
    const session = cryptoService.decrypt(sessionCookie);

    if (session.expiryDate && Date.now() > session.expiryDate) {
      res.clearCookie('si_session');
      return res.status(401).json({
        error: 'Google Drive session expired. Please reconnect.',
        reconnect: true,
      });
    }

    req.accessToken = session.accessToken;
    return next();
  } catch {
    res.clearCookie('si_session');
    return res.status(401).json({
      error: 'Invalid session cookie. Please reconnect your Google Drive.',
      reconnect: true,
    });
  }
}

// 1. GET /api/drive/candidates
driveRouter.get('/candidates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 60;
    const candidates = await driveService.listCandidates(req.accessToken!, limit);
    return res.status(200).json({ files: candidates });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        route: 'GET /api/drive/candidates',
        error: err instanceof Error ? err.message : 'Unknown Drive API error',
        timestamp: new Date().toISOString(),
      })
    );
    return res.status(500).json({
      error: 'Failed to retrieve files from Google Drive.',
    });
  }
});

// 2. POST /api/drive/trash
driveRouter.post('/trash', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = TrashRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid trash request format or payload exceeds 25 files.',
      details: parseResult.error.flatten(),
    });
  }

  try {
    const results = await driveService.trashFiles(
      req.accessToken!,
      parseResult.data.ids
    );
    return res.status(200).json({ results });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        route: 'POST /api/drive/trash',
        error: err instanceof Error ? err.message : 'Unknown Drive API error',
        timestamp: new Date().toISOString(),
      })
    );
    return res.status(500).json({
      error: 'Failed to trash requested files in Google Drive.',
    });
  }
});

// 3. POST /api/drive/restore
driveRouter.post('/restore', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = RestoreRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid restore request format or payload exceeds 25 files.',
      details: parseResult.error.flatten(),
    });
  }

  try {
    const results = await driveService.restoreFiles(
      req.accessToken!,
      parseResult.data.ids
    );
    return res.status(200).json({ results });
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        route: 'POST /api/drive/restore',
        error: err instanceof Error ? err.message : 'Unknown Drive API error',
        timestamp: new Date().toISOString(),
      })
    );
    return res.status(500).json({
      error: 'Failed to restore files in Google Drive.',
    });
  }
});
