import { describe, it, expect } from 'vitest';
import { GameEngine } from './engine';
import type { FileMeta, Analysis } from '@storage-invaders/shared';

describe('GameEngine Core Logic', () => {
  const createMockFile = (id: string, name: string, size: number): FileMeta => ({
    id,
    name,
    mimeType: 'application/octet-stream',
    size,
    modifiedTime: '2023-01-01T00:00:00Z',
  });

  const createMockAnalysis = (
    id: string,
    verdict: 'junk' | 'maybe' | 'keep'
  ): Analysis => ({
    id,
    verdict,
    confidence: 0.9,
    reason: `Test reason for ${id}`,
    category: 'other',
    source: 'heuristic',
  });

  it('initializes with correct defaults and clamped boundaries', () => {
    const engine = new GameEngine({ worldWidth: 800, worldHeight: 600 });
    expect(engine.ship.x).toBeGreaterThan(0);
    expect(engine.ship.y).toBe(600 - 40 - 20);
    expect(engine.stats.combo).toBe(1);
    expect(engine.stats.confirmedFreedBytes).toBe(0);

    // Test boundary clamping to left
    engine.ship.x = -100;
    engine.update(1 / 60);
    expect(engine.ship.x).toBe(10);

    // Test boundary clamping to right
    engine.ship.x = 900;
    engine.update(1 / 60);
    expect(engine.ship.x).toBe(800 - 10 - engine.ship.width);
  });

  it('spawns asteroids correctly when wave is loaded', () => {
    const engine = new GameEngine({ worldWidth: 800, worldHeight: 600 });
    const f1 = createMockFile('f-1', 'setup.exe', 50000000);
    const a1 = createMockAnalysis('f-1', 'junk');

    engine.loadWave({
      waveNumber: 1,
      files: [{ file: f1, analysis: a1 }],
    });

    // Advance time to trigger spawn
    engine.update(0.5);
    expect(engine.asteroids.length).toBe(1);
    expect(engine.asteroids[0].id).toBe('f-1');
    expect(engine.asteroids[0].state).toBe('active');
  });

  it('increments combo and pending bytes when shooting a junk asteroid', () => {
    const engine = new GameEngine({ worldWidth: 800, worldHeight: 600 });
    const f1 = createMockFile('f-junk', 'temp.tmp', 10485760); // 10MB
    const a1 = createMockAnalysis('f-junk', 'junk');

    engine.loadWave({
      waveNumber: 1,
      files: [{ file: f1, analysis: a1 }],
    });
    engine.update(0.5); // Spawn asteroid

    const ast = engine.asteroids[0];
    ast.x = engine.ship.x + 8; // Align with left wing bullet
    ast.y = engine.ship.y - 100; // Directly above ship

    // Fire laser
    engine.fire();
    expect(engine.bullets.length).toBe(2);

    // Advance bullets into collision
    let collided = false;
    for (let tick = 0; tick < 30; tick++) {
      engine.update(1 / 60);
      if (ast.state === 'shattering' || ast.state === 'pending_trash') {
        collided = true;
        break;
      }
    }

    expect(collided).toBe(true);
    expect(engine.stats.combo).toBe(2);
    expect(engine.stats.pendingFreedBytes).toBe(10485760);
    expect(engine.stats.confirmedFreedBytes).toBe(0); // Not confirmed yet
  });

  it('pauses and intercepts when shooting a guarded keep file', () => {
    const engine = new GameEngine({ worldWidth: 800, worldHeight: 600 });
    const fKeep = createMockFile('f-keep', 'Tax_Return_2025.pdf', 5242880);
    const aKeep = createMockAnalysis('f-keep', 'keep');

    let intercepted = false;
    engine.addEventListener((e) => {
      if (e.type === 'keep_intercepted') {
        intercepted = true;
      }
    });

    engine.loadWave({
      waveNumber: 1,
      files: [{ file: fKeep, analysis: aKeep }],
    });
    engine.update(0.5);

    const ast = engine.asteroids[0];
    ast.x = engine.ship.x + 8;
    ast.y = engine.ship.y - 80;

    engine.fire();
    for (let tick = 0; tick < 20; tick++) {
      engine.update(1 / 60);
    }

    expect(intercepted).toBe(true);
    expect(engine.isPaused).toBe(true);
    expect(ast.state).toBe('guarded');
    expect(engine.stats.combo).toBe(1); // Combo reset
  });

  it('updates confirmed bytes freed upon confirmation and cleans up asteroid', () => {
    const engine = new GameEngine();
    engine.stats.pendingFreedBytes = 1000000;

    engine.confirmTrash('f-1', 1000000);
    expect(engine.stats.confirmedFreedBytes).toBe(1000000);
    expect(engine.stats.pendingFreedBytes).toBe(0);
    expect(engine.stats.trashedCount).toBe(1);
  });

  it('triggers wave_complete when all asteroids are processed', () => {
    const engine = new GameEngine();
    let waveCompleteFired = false;
    engine.addEventListener((e) => {
      if (e.type === 'wave_complete') {
        waveCompleteFired = true;
      }
    });

    const f1 = createMockFile('f-esc', 'escape.zip', 200000);
    const a1 = createMockAnalysis('f-esc', 'junk');
    engine.loadWave({ waveNumber: 1, files: [{ file: f1, analysis: a1 }] });
    engine.update(0.5);

    // Force asteroid off bottom of screen
    engine.asteroids[0].y = 700;
    engine.update(1 / 60);

    expect(engine.stats.escapedCount).toBe(1);
    expect(waveCompleteFired).toBe(true);
  });
});
