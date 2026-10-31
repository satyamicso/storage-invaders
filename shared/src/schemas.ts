import { z } from 'zod';

export const VerdictSchema = z.enum(['junk', 'maybe', 'keep']);
export type Verdict = z.infer<typeof VerdictSchema>;

export const FileCategorySchema = z.enum([
  'installer',
  'duplicate',
  'old_media',
  'document',
  'archive',
  'backup',
  'spreadsheet',
  'presentation',
  'code',
  'system',
  'other',
]);
export type FileCategory = z.infer<typeof FileCategorySchema>;

export const FileMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.number().nonnegative(),
  modifiedTime: z.string().min(1),
  viewedByMeTime: z.string().optional(),
  parents: z.array(z.string()).optional(),
  parentName: z.string().max(255).optional(),
  trashed: z.boolean().optional(),
});
export type FileMeta = z.infer<typeof FileMetaSchema>;

export const AnalysisSchema = z.object({
  id: z.string().min(1),
  verdict: VerdictSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(80),
  category: FileCategorySchema,
  source: z.enum(['gemini', 'heuristic']).optional().default('heuristic'),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const ActionResultSchema = z.object({
  id: z.string().min(1),
  success: z.boolean(),
  error: z.string().optional(),
  trashed: z.boolean(),
});
export type ActionResult = z.infer<typeof ActionResultSchema>;

export const BatchAnalyzeRequestSchema = z.object({
  files: z.array(FileMetaSchema).min(1).max(25),
});
export type BatchAnalyzeRequest = z.infer<typeof BatchAnalyzeRequestSchema>;

export const BatchAnalyzeResponseSchema = z.object({
  analyses: z.array(AnalysisSchema),
  source: z.enum(['gemini', 'heuristic']),
});
export type BatchAnalyzeResponse = z.infer<typeof BatchAnalyzeResponseSchema>;

export const TrashRequestSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(25),
});
export type TrashRequest = z.infer<typeof TrashRequestSchema>;

export const RestoreRequestSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(25),
});
export type RestoreRequest = z.infer<typeof RestoreRequestSchema>;
