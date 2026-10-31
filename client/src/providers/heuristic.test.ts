import { describe, it, expect } from 'vitest';
import { HeuristicClassifier } from './heuristic';
import type { FileMeta } from '@storage-invaders/shared';

describe('HeuristicClassifier', () => {
  const meta = (name: string, size = 1000000): FileMeta => ({
    id: `test-${name}`,
    name,
    mimeType: 'application/octet-stream',
    size,
    modifiedTime: '2023-01-01T00:00:00Z',
  });

  it('classifies legal, tax, and resume documents as KEEP', () => {
    const keepNames = [
      'Tax_Return_2025_Final.pdf',
      'Passport_Scan_Official.pdf',
      'Master_Resume_2026.docx',
      'Employment_Agreement_Signed.pdf',
      'W2_Tax_Statement.pdf',
      'Apartment_Lease_Contract.pdf',
    ];

    for (const name of keepNames) {
      const analysis = HeuristicClassifier.classify(meta(name));
      expect(analysis.verdict).toBe('keep');
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.9);
      expect(analysis.source).toBe('heuristic');
    }
  });

  it('classifies software installers as JUNK', () => {
    const installerNames = [
      'ChromeSetup.exe',
      'DockerDesktop.dmg',
      'Blender-4.0.msi',
      'ubuntu-22.04.iso',
      'ZoomInstaller.pkg',
    ];

    for (const name of installerNames) {
      const analysis = HeuristicClassifier.classify(meta(name, 500000000));
      expect(analysis.verdict).toBe('junk');
      expect(analysis.category).toBe('installer');
    }
  });

  it('classifies duplicate copy files as JUNK', () => {
    const duplicateNames = [
      'Pitch_Deck_v2 (1).pdf',
      'Financial_Model (2).xlsx',
      'Family_Photos - Copy.zip',
      'Logo_Assets.copy.png',
    ];

    for (const name of duplicateNames) {
      const analysis = HeuristicClassifier.classify(meta(name));
      expect(analysis.verdict).toBe('junk');
      expect(analysis.category).toBe('duplicate');
    }
  });

  it('classifies massive old screen recordings as JUNK', () => {
    const screenRec = meta('Screen Recording 2022-04-12.mov', 800 * 1024 * 1024); // 800MB
    const analysis = HeuristicClassifier.classify(screenRec);
    expect(analysis.verdict).toBe('junk');
    expect(analysis.category).toBe('old_media');
  });

  it('classifies ambiguous files as MAYBE', () => {
    const ambiguousFile = meta('Design_Presentation_Concept.key', 80 * 1024 * 1024);
    const analysis = HeuristicClassifier.classify(ambiguousFile);
    expect(analysis.verdict).toBe('maybe');
  });
});
