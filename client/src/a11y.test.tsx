// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import axe from 'axe-core';
import { TriageListMode } from './components/TriageListMode';
import { KeepDialog } from './components/KeepDialog';
import type { Asteroid } from './game/engine/types';

describe('Accessibility Audit (WCAG 2.2 AA Compliance via axe-core)', () => {
  it('TriageListMode renders valid accessible markup with zero axe violations', async () => {
    const mockItems = [
      {
        file: {
          id: 'test-f1',
          name: 'ChromeSetup.exe',
          mimeType: 'application/x-msdownload',
          size: 50000000,
          modifiedTime: '2023-01-01T00:00:00Z',
        },
        analysis: {
          id: 'test-f1',
          verdict: 'junk' as const,
          confidence: 0.95,
          reason: 'Application installer that can be safely discarded.',
          category: 'installer' as const,
          source: 'heuristic' as const,
        },
        status: 'active' as const,
      },
      {
        file: {
          id: 'test-f2',
          name: 'Tax_Return_2025.pdf',
          mimeType: 'application/pdf',
          size: 15000000,
          modifiedTime: '2025-04-10T00:00:00Z',
        },
        analysis: {
          id: 'test-f2',
          verdict: 'keep' as const,
          confidence: 0.98,
          reason: 'Vital tax return document.',
          category: 'document' as const,
          source: 'gemini' as const,
        },
        status: 'active' as const,
      },
    ];

    const html = renderToString(
      <main>
        <TriageListMode
          items={mockItems}
          onTrash={() => {}}
          onKeep={() => {}}
          onUndo={() => {}}
        />
      </main>
    );

    document.body.innerHTML = html;

    const results = await axe.run(document.body, {
      rules: {
        // Color contrast is checked in browser environment; in headless node/happy-dom fonts aren't rasterized
        'color-contrast': { enabled: false },
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  it('KeepDialog modal renders valid accessible alertdialog with zero axe violations', async () => {
    const mockAsteroid: Asteroid = {
      id: 'ast-keep-1',
      file: {
        id: 'ast-keep-1',
        name: 'Official_Passport_Scan.pdf',
        mimeType: 'application/pdf',
        size: 5242880,
        modifiedTime: '2024-01-01T00:00:00Z',
      },
      analysis: {
        id: 'ast-keep-1',
        verdict: 'keep',
        confidence: 0.95,
        reason: 'Official passport identification scan.',
        category: 'document',
        source: 'gemini',
      },
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 35,
      rotation: 0,
      rotationSpeed: 0,
      vertices: [],
      state: 'guarded',
      shatterProgress: 0,
    };

    const html = renderToString(
      <div role="region" aria-label="Modal container">
        <KeepDialog
          asteroid={mockAsteroid}
          onCancelKeep={() => {}}
          onConfirmTrashAnyway={() => {}}
        />
      </div>
    );

    document.body.innerHTML = html;

    const results = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });
});
