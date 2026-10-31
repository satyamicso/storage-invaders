import type { FileMeta, Analysis } from '@storage-invaders/shared';
import { HeuristicClassifier } from '@storage-invaders/shared';

export interface TriageApiResponse {
  analyses: Analysis[];
  source: 'gemini' | 'heuristic';
}

export async function analyzeFilesApi(files: FileMeta[]): Promise<TriageApiResponse> {
  if (files.length === 0) {
    return { analyses: [], source: 'heuristic' };
  }

  // Chunk into batches of at most 25 files to respect API contract
  const chunkSize = 25;
  const chunks: FileMeta[][] = [];
  for (let i = 0; i < files.length; i += chunkSize) {
    chunks.push(files.slice(i, i + chunkSize));
  }

  let finalSource: 'gemini' | 'heuristic' = 'gemini';
  const allAnalyses: Analysis[] = [];

  for (const batch of chunks) {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: batch }),
      });

      if (res.ok) {
        const data: TriageApiResponse = await res.json();
        allAnalyses.push(...data.analyses);
        if (data.source === 'heuristic') {
          finalSource = 'heuristic';
        }
      } else {
        console.warn(`[Client] Server returned status ${res.status}. Falling back to HeuristicClassifier for batch.`);
        allAnalyses.push(...HeuristicClassifier.classifyBatch(batch));
        finalSource = 'heuristic';
      }
    } catch (err) {
      console.warn('[Client] Network failure calling /api/analyze. Falling back to HeuristicClassifier:', err);
      allAnalyses.push(...HeuristicClassifier.classifyBatch(batch));
      finalSource = 'heuristic';
    }
  }

  return {
    analyses: allAnalyses,
    source: finalSource,
  };
}
