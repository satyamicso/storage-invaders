import type { FileMeta, Analysis } from '@storage-invaders/shared';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Ship {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  vx: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alive: boolean;
}

export type AsteroidState =
  | 'active'
  | 'pending_trash'
  | 'shattering'
  | 'destroyed'
  | 'escaped'
  | 'guarded';

export interface AsteroidVertex {
  angle: number;
  distance: number;
}

export interface Asteroid {
  id: string;
  file: FileMeta;
  analysis: Analysis;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  vertices: AsteroidVertex[];
  state: AsteroidState;
  shatterProgress: number; // 0 to 1
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
}

export interface EngineConfig {
  worldWidth: number;
  worldHeight: number;
  fixedDt: number; // typically 1/60
  speedMultiplier: number;
  reducedMotion: boolean;
}

export interface EngineStats {
  score: number;
  confirmedFreedBytes: number;
  pendingFreedBytes: number;
  combo: number;
  maxCombo: number;
  wave: number;
  totalWaves: number;
  trashedCount: number;
  keptCount: number;
  escapedCount: number;
}

export type EngineEventType =
  | 'laser_fire'
  | 'asteroid_hit'
  | 'junk_destroyed'
  | 'maybe_destroyed'
  | 'keep_intercepted'
  | 'asteroid_escaped'
  | 'combo_break'
  | 'wave_complete'
  | 'all_waves_complete';

export interface EngineEvent {
  type: EngineEventType;
  payload?: {
    asteroid?: Asteroid;
    bytesFreed?: number;
    combo?: number;
    reason?: string;
  };
}

export type EngineEventListener = (event: EngineEvent) => void;
