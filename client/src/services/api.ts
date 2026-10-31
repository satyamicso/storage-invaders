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

  // Cap to max 25 files per batch
  const batch = files.slice(0, 25);

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
      return data;
    }

    // If server rate limited or error, fall back to client heuristic
    console.warn(`[Client] Server returned status ${res.status}. Falling back to HeuristicClassifier.`);
    return {
      analyses: HeuristicClassifier.classifyBatch(batch),
      source: 'heuristic',
    };
  } catch (err) {
    console.warn('[Client] Network failure calling /api/analyze. Falling back to HeuristicClassifier:', err);
    return {
      analyses: HeuristicClassifier.classifyBatch(batch),
      source: 'heuristic',
    };
  }
}
