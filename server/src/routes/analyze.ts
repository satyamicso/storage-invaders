import { Router, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { BatchAnalyzeRequestSchema } from '@storage-invaders/shared';
import { GeminiTriageService } from '../services/gemini.js';

export const analyzeRouter = Router();
const triageService = new GeminiTriageService();

// Stricter rate limiter specifically for /api/analyze to preserve Gemini quota
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // Max 120 analyze requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded for triage analysis. Please try again later.',
  },
});

analyzeRouter.post('/', analyzeLimiter, async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Validate request payload with Zod
  const parseResult = BatchAnalyzeRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request format or too many files (max 25 allowed per request).',
      details: parseResult.error.flatten(),
    });
  }

  const { files } = parseResult.data;

  try {
    const result = await triageService.triageBatch(files);
    const durationMs = Date.now() - startTime;

    // Structured JSON log (Never log tokens or file names)
    console.log(
      JSON.stringify({
        level: 'INFO',
        route: 'POST /api/analyze',
        status: 200,
        fileCount: files.length,
        source: result.source,
        durationMs,
        timestamp: new Date().toISOString(),
      })
    );

    return res.status(200).json(result);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(
      JSON.stringify({
        level: 'ERROR',
        route: 'POST /api/analyze',
        error: err instanceof Error ? err.message : 'Unknown server error',
        durationMs,
        timestamp: new Date().toISOString(),
      })
    );

    return res.status(500).json({
      error: 'Failed to complete triage analysis.',
    });
  }
});
