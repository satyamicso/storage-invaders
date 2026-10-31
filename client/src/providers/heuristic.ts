import type { FileMeta, Analysis, Verdict, FileCategory } from '@storage-invaders/shared';

export class HeuristicClassifier {
  public static classify(file: FileMeta): Analysis {
    const nameLower = file.name.toLowerCase();
    const sizeMB = file.size / (1024 * 1024);

    // Rule 1: High-priority critical documents -> KEEP
    const keepPatterns = [
      /tax[-_ ]?(return|doc|\d{4})/i,
      /passport/i,
      /resume|curriculum[-_ ]?vitae|\bcv\b/i,
      /w[-_]?2|1099/i,
      /contract|agreement|nda/i,
      /birth[-_ ]?certificate/i,
      /insurance[-_ ]?policy/i,
      /diploma|degree|transcript/i,
      /will[-_ ]?and[-_ ]?testament/i,
    ];

    for (const pattern of keepPatterns) {
      if (pattern.test(nameLower)) {
        return {
          id: file.id,
          verdict: 'keep' as Verdict,
          confidence: 0.95,
          reason: 'Important legal, financial, or personal identification document.',
          category: 'document' as FileCategory,
          source: 'heuristic',
        };
      }
    }

    // Rule 2: Obvious installers & package files -> JUNK
    const installerExtensions = /\.(exe|dmg|pkg|msi|iso|deb|rpm|apk|appimage)$/i;
    if (installerExtensions.test(nameLower) || /setup|installer|install/i.test(nameLower)) {
      return {
        id: file.id,
        verdict: 'junk' as Verdict,
        confidence: 0.92,
        reason: 'Application installer or package that can be re-downloaded if needed.',
        category: 'installer' as FileCategory,
        source: 'heuristic',
      };
    }

    // Rule 3: Duplicates & copy suffixes -> JUNK
    const duplicatePattern = /(\(\d+\)|_copy| - copy|\.copy\d*)\.[a-z0-9]+$/i;
    if (duplicatePattern.test(nameLower)) {
      return {
        id: file.id,
        verdict: 'junk' as Verdict,
        confidence: 0.89,
        reason: 'Duplicate file copy occupying redundant storage space.',
        category: 'duplicate' as FileCategory,
        source: 'heuristic',
      };
    }

    // Rule 4: Temporary system caches, node_modules backups, dump files -> JUNK
    if (
      /node_modules|\.tmp$|\.bak$|\.log$|crash_dump|\.dmp$/i.test(nameLower) ||
      /\.(tar\.gz|zip|tgz)$/i.test(nameLower) && /backup|dump|cache/i.test(nameLower)
    ) {
      return {
        id: file.id,
        verdict: 'junk' as Verdict,
        confidence: 0.91,
        reason: 'Temporary cache or backup dump safe to discard.',
        category: 'backup' as FileCategory,
        source: 'heuristic',
      };
    }

    // Rule 5: Old screen recordings / huge raw captures -> JUNK or MAYBE
    const isScreenCapture = /screen(shot|[-_ ]?recording|\s*shot)/i.test(nameLower);
    if (isScreenCapture) {
      if (sizeMB > 100) {
        return {
          id: file.id,
          verdict: 'junk' as Verdict,
          confidence: 0.84,
          reason: 'Large screen recording rarely referenced after creation.',
          category: 'old_media' as FileCategory,
          source: 'heuristic',
        };
      }
      return {
        id: file.id,
        verdict: 'maybe' as Verdict,
        confidence: 0.72,
        reason: 'Screen capture that may contain reference material.',
        category: 'old_media' as FileCategory,
        source: 'heuristic',
      };
    }

    // Rule 6: Massive forgotten archives (> 500 MB)
    if (/\.(zip|rar|7z|tar)$/i.test(nameLower) && sizeMB > 300) {
      return {
        id: file.id,
        verdict: 'maybe' as Verdict,
        confidence: 0.75,
        reason: 'Large uninspected archive file occupying significant quota.',
        category: 'archive' as FileCategory,
        source: 'heuristic',
      };
    }

    // Rule 7: Default classification based on size
    if (sizeMB > 200) {
      return {
        id: file.id,
        verdict: 'maybe' as Verdict,
        confidence: 0.65,
        reason: 'Large file with substantial storage footprint. Review recommended.',
        category: 'other' as FileCategory,
        source: 'heuristic',
      };
    }

    return {
      id: file.id,
      verdict: 'maybe' as Verdict,
      confidence: 0.55,
      reason: 'General file. Verify contents before discarding.',
      category: 'other' as FileCategory,
      source: 'heuristic',
    };
  }

  public static classifyBatch(files: FileMeta[]): Analysis[] {
    return files.map((f) => this.classify(f));
  }
}
