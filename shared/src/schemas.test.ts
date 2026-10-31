import { describe, it, expect } from 'vitest';
import {
  FileMetaSchema,
  AnalysisSchema,
  BatchAnalyzeRequestSchema,
  VerdictSchema,
} from './schemas.js';

describe('Shared Schemas', () => {
  it('validates a standard FileMeta object', () => {
    const validMeta = {
      id: 'file-123',
      name: 'large_installer.exe',
      mimeType: 'application/x-msdownload',
      size: 524288000,
      modifiedTime: '2023-01-15T12:00:00Z',
    };
    const parsed = FileMetaSchema.safeParse(validMeta);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.trashed).toBeUndefined();
    }
  });

  it('rejects an invalid verdict', () => {
    expect(VerdictSchema.safeParse('junk').success).toBe(true);
    expect(VerdictSchema.safeParse('keep').success).toBe(true);
    expect(VerdictSchema.safeParse('maybe').success).toBe(true);
    expect(VerdictSchema.safeParse('destroy_everything').success).toBe(false);
  });

  it('enforces 80-character maximum on analysis reasoning', () => {
    const validAnalysis = {
      id: 'file-1',
      verdict: 'junk',
      confidence: 0.95,
      reason: 'Duplicate installer file, last opened 2 years ago.',
      category: 'installer',
      source: 'heuristic',
    };
    expect(AnalysisSchema.safeParse(validAnalysis).success).toBe(true);

    const overlyLongReason = {
      ...validAnalysis,
      reason: 'A'.repeat(81),
    };
    expect(AnalysisSchema.safeParse(overlyLongReason).success).toBe(false);
  });

  it('rejects batch requests exceeding 25 files', () => {
    const dummyFile = {
      id: 'f1',
      name: 'test.zip',
      mimeType: 'application/zip',
      size: 1000,
      modifiedTime: '2023-01-01T00:00:00Z',
    };
    const validBatch = Array.from({ length: 25 }, (_, i) => ({
      ...dummyFile,
      id: `f-${i}`,
    }));
    expect(
      BatchAnalyzeRequestSchema.safeParse({ files: validBatch }).success
    ).toBe(true);

    const oversizedBatch = Array.from({ length: 26 }, (_, i) => ({
      ...dummyFile,
      id: `f-${i}`,
    }));
    expect(
      BatchAnalyzeRequestSchema.safeParse({ files: oversizedBatch }).success
    ).toBe(false);
  });
});
