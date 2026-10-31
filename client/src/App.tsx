import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine/engine';
import { CanvasRenderer } from './game/renderer/canvasRenderer';
import { SoundSynthesizer } from './game/audio/synth';
import { DemoProvider } from './providers/demoProvider';
import { HeuristicClassifier } from './providers/heuristic';
import { ActionQueue, type QueuedAction } from './queue/actionQueue';
import { analyzeFilesApi } from './services/api';
import type { Asteroid, EngineStats } from './game/engine/types';
import type { FileMeta, Analysis } from '@storage-invaders/shared';

import { HUD } from './components/HUD';
import { TrashBay } from './components/TrashBay';
import { KeepDialog } from './components/KeepDialog';
import { EndScreen } from './components/EndScreen';
import { Tooltip } from './components/Tooltip';
import { TriageListMode } from './components/TriageListMode';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const synthRef = useRef<SoundSynthesizer | null>(null);
  const queueRef = useRef<ActionQueue | null>(null);
  const providerRef = useRef<DemoProvider | null>(null);

  // Cache for prefetched wave analyses
  const prefetchedWaveRef = useRef<{
    waveNumber: number;
    files: Array<{ file: FileMeta; analysis: Analysis }>;
  } | null>(null);

  const [stats, setStats] = useState<EngineStats>({
    score: 0,
    confirmedFreedBytes: 0,
    pendingFreedBytes: 0,
    combo: 1,
    maxCombo: 1,
    wave: 1,
    totalWaves: 3,
    trashedCount: 0,
    keptCount: 0,
    escapedCount: 0,
  });

  const [aiSource, setAiSource] = useState<'gemini' | 'heuristic'>('heuristic');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [pendingActions, setPendingActions] = useState<QueuedAction[]>([]);
  const [confirmedActions, setConfirmedActions] = useState<QueuedAction[]>([]);
  const [guardedAsteroid, setGuardedAsteroid] = useState<Asteroid | null>(null);
  const [hoveredAsteroid, setHoveredAsteroid] = useState<Asteroid | null>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListMode, setIsListMode] = useState(false);
  const [isWaveComplete, setIsWaveComplete] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Triage list items for List Mode
  const [listItems, setListItems] = useState<
    Array<{
      file: FileMeta;
      analysis: Analysis;
      status: 'active' | 'pending_trash' | 'trashed' | 'kept';
    }>
  >([]);

  // Asynchronous prefetch of next wave's triage while current wave plays
  const triggerNextWavePrefetch = useCallback(async (nextWaveNum: number) => {
    const provider = providerRef.current;
    if (!provider) return;

    try {
      const candidates = await provider.listCandidates(40);
      const nextBatch = candidates.slice(20, 40);

      if (nextBatch.length > 0) {
        const { analyses } = await analyzeFilesApi(nextBatch);
        const filesWithAnalysis = nextBatch.map((file, idx) => ({
          file,
          analysis: analyses[idx] || HeuristicClassifier.classify(file),
        }));

        prefetchedWaveRef.current = {
          waveNumber: nextWaveNum,
          files: filesWithAnalysis,
        };
      }
    } catch (err) {
      console.warn('Next wave prefetch failed (non-critical):', err);
    }
  }, []);

  // 1. Initialize Engine, Provider, and Queue once on mount
  useEffect(() => {
    const provider = new DemoProvider(50);
    providerRef.current = provider;

    const queue = new ActionQueue(provider, 5000);
    queueRef.current = queue;

    const synth = new SoundSynthesizer(false);
    synthRef.current = synth;

    // Detect OS reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const engine = new GameEngine({
      worldWidth: 800,
      worldHeight: 600,
      fixedDt: 1 / 60,
      reducedMotion: prefersReducedMotion,
    });
    engineRef.current = engine;

    // Connect Queue callbacks to Engine scoring
    queue.onConfirm((file) => {
      engine.confirmTrash(file.id, file.size);
      setStats({ ...engine.stats });
      setAnnouncement(`File ${file.name} confirmed trashed. Storage freed.`);
      synth.playComboChime(engine.stats.combo);
    });

    queue.onRollback((file) => {
      engine.rollbackTrash(
        file.id,
        file.size,
        file,
        HeuristicClassifier.classify(file)
      );
      setStats({ ...engine.stats });
      setAnnouncement(`Trashing undone for ${file.name}.`);
      synth.playUndo();
    });

    queue.onRestore((file) => {
      engine.stats.confirmedFreedBytes = Math.max(
        0,
        engine.stats.confirmedFreedBytes - file.size
      );
      engine.stats.trashedCount = Math.max(0, engine.stats.trashedCount - 1);
      setStats({ ...engine.stats });
      setAnnouncement(`File ${file.name} restored to Drive.`);
      synth.playUndo();
    });

    queue.subscribe(() => {
      setPendingActions(queue.getPendingActions());
      setConfirmedActions(queue.getConfirmedActions());
    });

    // Listen to Engine events
    engine.addEventListener((e) => {
      if (e.type === 'laser_fire') {
        synth.playLaser();
      } else if (e.type === 'junk_destroyed') {
        synth.playExplosion(false);
        if (e.payload?.asteroid) {
          queue.enqueueTrash(e.payload.asteroid.file);
          setAnnouncement(`Junk hit! Trashing ${e.payload.asteroid.file.name}.`);
        }
        setStats({ ...engine.stats });
      } else if (e.type === 'maybe_destroyed') {
        synth.playExplosion(false);
        if (e.payload?.asteroid) {
          queue.enqueueTrash(e.payload.asteroid.file);
        }
        setStats({ ...engine.stats });
      } else if (e.type === 'keep_intercepted') {
        synth.playShieldAlert();
        if (e.payload?.asteroid) {
          setGuardedAsteroid(e.payload.asteroid);
          setIsPaused(true);
        }
      } else if (e.type === 'wave_complete') {
        setIsWaveComplete(true);
        setAnnouncement('Wave complete! Review your storage freed summary.');
      }
    });

    // Load initial wave files from DemoProvider with real Gemini/API triage
    const loadInitialWave = async () => {
      const candidates = await provider.listCandidates(20);
      const { analyses, source } = await analyzeFilesApi(candidates);
      setAiSource(source);

      const waveFiles = candidates.map((file, idx) => ({
        file,
        analysis: analyses[idx] || HeuristicClassifier.classify(file),
      }));

      engine.loadWave({ waveNumber: 1, files: waveFiles });
      setListItems(
        waveFiles.map((wf) => ({
          file: wf.file,
          analysis: wf.analysis,
          status: 'active',
        }))
      );
      setStats({ ...engine.stats });

      // Trigger prefetch for Wave 2
      triggerNextWavePrefetch(2);
    };

    loadInitialWave();

    return () => {
      queue.clear();
    };
  }, [triggerNextWavePrefetch]);

  // 2. Setup Canvas Renderer and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      const engine = engineRef.current;
      if (engine && !engine.isPaused) {
        engine.update(dt);
        setStats({ ...engine.stats });
      }

      if (engine && renderer) {
        renderer.render(engine, hoveredAsteroid?.id);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [hoveredAsteroid]);

  // 3. Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (guardedAsteroid) return; // Modal is active

      const engine = engineRef.current;
      if (!engine) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.moveShip(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.moveShip(1);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        engine.fire();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const nextState = !engine.isPaused;
        if (nextState) engine.pause();
        else engine.resume();
        setIsPaused(nextState);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (
        e.key === 'ArrowLeft' ||
        e.key === 'a' ||
        e.key === 'A' ||
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'D'
      ) {
        engine.moveShip(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [guardedAsteroid]);

  // 4. Mouse Move for Asteroid Tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    const engine = engineRef.current;
    if (!canvas || !renderer || !engine) return;

    const rect = canvas.getBoundingClientRect();
    setCanvasRect(rect);
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    const hit = renderer.getAsteroidAt(
      engine.asteroids,
      canvasX,
      canvasY,
      engine.config.worldWidth,
      engine.config.worldHeight
    );
    setHoveredAsteroid(hit);
  }, []);

  const handleCanvasClick = useCallback(() => {
    const engine = engineRef.current;
    if (engine) engine.fire();
  }, []);

  // UI Handlers
  const handleTogglePause = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const nextState = !engine.isPaused;
    if (nextState) engine.pause();
    else engine.resume();
    setIsPaused(nextState);
  };

  const handleToggleMute = () => {
    const synth = synthRef.current;
    if (!synth) return;
    const muted = synth.toggleMute();
    setIsMuted(muted);
  };

  const handleChangeSpeed = (speed: number) => {
    setSpeedMultiplier(speed);
    if (engineRef.current) {
      engineRef.current.setSpeedMultiplier(speed);
    }
  };

  const handleUndo = (id: string) => {
    queueRef.current?.undo(id);
    setListItems((prev) =>
      prev.map((item) =>
        item.file.id === id ? { ...item, status: 'active' } : item
      )
    );
  };

  const handleRestore = (id: string) => {
    queueRef.current?.restore(id);
    setListItems((prev) =>
      prev.map((item) =>
        item.file.id === id ? { ...item, status: 'active' } : item
      )
    );
  };

  const handleRestoreAll = () => {
    queueRef.current?.restoreAll();
    setListItems((prev) =>
      prev.map((item) => ({ ...item, status: 'active' }))
    );
  };

  const handleCancelKeep = () => {
    if (!guardedAsteroid || !engineRef.current) return;
    engineRef.current.keepConfirmed(guardedAsteroid.id);
    engineRef.current.resume();
    setIsPaused(false);
    setGuardedAsteroid(null);
    setAnnouncement(`File ${guardedAsteroid.file.name} kept safe.`);
  };

  const handleConfirmTrashAnyway = () => {
    if (!guardedAsteroid || !engineRef.current || !queueRef.current) return;
    const file = guardedAsteroid.file;
    engineRef.current.forceDestroyGuarded(file.id);
    queueRef.current.enqueueTrash(file);
    setIsPaused(false);
    setGuardedAsteroid(null);
    setAnnouncement(`Guarded file ${file.name} sent to trash queue.`);
  };

  // List Mode Handlers
  const handleListTrash = (file: FileMeta, analysis: Analysis) => {
    if (analysis.verdict === 'keep') {
      const dummyAst: Asteroid = {
        id: file.id,
        file,
        analysis,
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        radius: 30,
        rotation: 0,
        rotationSpeed: 0,
        vertices: [],
        state: 'guarded',
        shatterProgress: 0,
      };
      setGuardedAsteroid(dummyAst);
      return;
    }

    queueRef.current?.enqueueTrash(file);
    setListItems((prev) =>
      prev.map((item) =>
        item.file.id === file.id ? { ...item, status: 'pending_trash' } : item
      )
    );
  };

  const handleListKeep = (file: FileMeta) => {
    setListItems((prev) =>
      prev.map((item) =>
        item.file.id === file.id ? { ...item, status: 'kept' } : item
      )
    );
    if (engineRef.current) {
      engineRef.current.stats.keptCount += 1;
      setStats({ ...engineRef.current.stats });
    }
  };

  const handlePlayNextWave = async () => {
    const provider = providerRef.current;
    const engine = engineRef.current;
    if (!provider || !engine) return;

    const nextWaveNum = stats.wave + 1;

    // Check if next wave was already prefetched
    let waveFiles: Array<{ file: FileMeta; analysis: Analysis }>;
    if (
      prefetchedWaveRef.current &&
      prefetchedWaveRef.current.waveNumber === nextWaveNum &&
      prefetchedWaveRef.current.files.length > 0
    ) {
      waveFiles = prefetchedWaveRef.current.files;
      prefetchedWaveRef.current = null;
    } else {
      const candidates = await provider.listCandidates(20);
      const { analyses, source } = await analyzeFilesApi(candidates);
      setAiSource(source);
      waveFiles = candidates.map((file, idx) => ({
        file,
        analysis: analyses[idx] || HeuristicClassifier.classify(file),
      }));
    }

    engine.loadWave({ waveNumber: nextWaveNum, files: waveFiles });
    setListItems(
      waveFiles.map((wf) => ({
        file: wf.file,
        analysis: wf.analysis,
        status: 'active',
      }))
    );
    setIsWaveComplete(false);

    // Trigger prefetch for wave + 1
    triggerNextWavePrefetch(nextWaveNum + 1);
  };

  return (
    <div className="app-container">
      {/* Skip link for keyboard accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen reader live announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Persistent HUD */}
      <HUD
        stats={stats}
        mode="demo"
        aiSource={aiSource}
        speedMultiplier={speedMultiplier}
        isMuted={isMuted}
        isPaused={isPaused}
        isListMode={isListMode}
        onChangeSpeed={handleChangeSpeed}
        onToggleMute={handleToggleMute}
        onTogglePause={handleTogglePause}
        onToggleListMode={() => setIsListMode(!isListMode)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="game-viewport">
        {isListMode ? (
          <TriageListMode
            items={listItems}
            onTrash={handleListTrash}
            onKeep={handleListKeep}
            onUndo={handleUndo}
          />
        ) : (
          <>
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredAsteroid(null)}
                onClick={handleCanvasClick}
                aria-label="Arcade space shooter canvas: asteroids falling represent files. Use arrow keys to steer and spacebar to fire."
                tabIndex={0}
              />
            </div>

            <div className="controls-banner" aria-label="Game Controls Guide">
              <span>
                Move: <kbd className="kbd-key">←</kbd> <kbd className="kbd-key">→</kbd> / <kbd className="kbd-key">A</kbd> <kbd className="kbd-key">D</kbd>
              </span>
              <span>
                Shoot: <kbd className="kbd-key">Space</kbd> / Click
              </span>
              <span>
                Pause: <kbd className="kbd-key">Esc</kbd>
              </span>
              <span>
                Target: <span className="text-red-400 font-bold">✕ Junk</span> | Guard: <span className="text-emerald-400 font-bold">🛡 Keep</span>
              </span>
            </div>
          </>
        )}
      </main>

      {/* Live Tooltip on Hover */}
      <Tooltip asteroid={hoveredAsteroid} canvasRect={canvasRect} />

      {/* Trash Bay with live undo toasts and dock drawer */}
      <TrashBay
        pendingActions={pendingActions}
        confirmedActions={confirmedActions}
        onUndo={handleUndo}
        onRestore={handleRestore}
        onRestoreAll={handleRestoreAll}
      />

      {/* Keep Guarded Interception Dialog */}
      <KeepDialog
        asteroid={guardedAsteroid}
        onCancelKeep={handleCancelKeep}
        onConfirmTrashAnyway={handleConfirmTrashAnyway}
      />

      {/* Wave Complete End Screen */}
      {isWaveComplete && (
        <EndScreen
          stats={stats}
          initialStorageBytes={13.8 * 1024 * 1024 * 1024}
          onPlayAgain={handlePlayNextWave}
          onRestoreAll={handleRestoreAll}
        />
      )}

      {/* Accessibility & Safety Policy Footer */}
      <footer className="app-footer" role="contentinfo">
        <p>
          <strong>Security Guarantee:</strong> AI advises, human decides. Metadata only is analyzed (never file contents).
          Trash only — permanent delete is physically impossible in this application.
        </p>
      </footer>
    </div>
  );
};
