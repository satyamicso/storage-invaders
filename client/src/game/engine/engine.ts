import type { FileMeta, Analysis } from '@storage-invaders/shared';
import type {
  Ship,
  Bullet,
  Asteroid,
  Particle,
  EngineConfig,
  EngineStats,
  EngineEvent,
  EngineEventListener,
} from './types';
import { SeededRNG } from './rng';
import {
  calculateAsteroidRadius,
  generateAsteroidVertices,
  checkBulletAsteroidCollision,
} from './physics';

export interface WaveData {
  waveNumber: number;
  files: Array<{ file: FileMeta; analysis: Analysis }>;
}

export class GameEngine {
  public config: EngineConfig;
  public ship: Ship;
  public bullets: Bullet[] = [];
  public asteroids: Asteroid[] = [];
  public particles: Particle[] = [];
  public rng: SeededRNG;

  public stats: EngineStats;
  public isPaused = false;
  public isWaveComplete = false;
  public isGameOver = false;

  private listeners: Set<EngineEventListener> = new Set();
  private shootCooldown = 0;
  private readonly shootInterval = 0.22; // Seconds between shots
  private pendingSpawnQueue: Array<{ file: FileMeta; analysis: Analysis }> = [];
  private spawnTimer = 0;
  private readonly spawnInterval = 1.4; // Seconds between asteroid spawns

  constructor(
    config: Partial<EngineConfig> = {},
    seed: number | string = 1337
  ) {
    this.config = {
      worldWidth: config.worldWidth ?? 800,
      worldHeight: config.worldHeight ?? 600,
      fixedDt: config.fixedDt ?? 1 / 60,
      speedMultiplier: config.speedMultiplier ?? 1.0,
      reducedMotion: config.reducedMotion ?? false,
    };

    this.rng = new SeededRNG(seed);

    const shipWidth = 44;
    const shipHeight = 40;
    this.ship = {
      x: (this.config.worldWidth - shipWidth) / 2,
      y: this.config.worldHeight - shipHeight - 20,
      width: shipWidth,
      height: shipHeight,
      speed: 360,
      vx: 0,
    };

    this.stats = {
      score: 0,
      confirmedFreedBytes: 0,
      pendingFreedBytes: 0,
      combo: 1,
      maxCombo: 1,
      wave: 1,
      totalWaves: 1,
      trashedCount: 0,
      keptCount: 0,
      escapedCount: 0,
    };
  }

  public addEventListener(listener: EngineEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: EngineEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in engine event listener:', err);
      }
    }
  }

  public setReducedMotion(reduced: boolean): void {
    this.config.reducedMotion = reduced;
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.config.speedMultiplier = Math.max(0.25, Math.min(2.0, multiplier));
  }

  public moveShip(direction: -1 | 0 | 1): void {
    this.ship.vx = direction * this.ship.speed;
  }

  public fire(): boolean {
    if (this.isPaused || this.isGameOver || this.shootCooldown > 0) {
      return false;
    }

    if (this.bullets.length >= 25) {
      return false; // Cap max active bullets
    }

    // Spawn 2 parallel lasers from ship wings
    const bulletRadius = 3;
    const bulletSpeed = -520 * this.config.speedMultiplier;

    this.bullets.push(
      {
        id: `b-${this.rng.next()}`,
        x: this.ship.x + 8,
        y: this.ship.y,
        vx: 0,
        vy: bulletSpeed,
        radius: bulletRadius,
        alive: true,
      },
      {
        id: `b-${this.rng.next()}`,
        x: this.ship.x + this.ship.width - 8,
        y: this.ship.y,
        vx: 0,
        vy: bulletSpeed,
        radius: bulletRadius,
        alive: true,
      }
    );

    this.shootCooldown = this.shootInterval;
    this.emit({ type: 'laser_fire' });
    return true;
  }

  public loadWave(wave: WaveData): void {
    this.stats.wave = wave.waveNumber;
    this.pendingSpawnQueue = [...wave.files];
    this.isWaveComplete = false;
    this.spawnTimer = 0.4; // Quick initial spawn
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public confirmTrash(fileId: string, bytesFreed: number): void {
    this.stats.confirmedFreedBytes += bytesFreed;
    this.stats.pendingFreedBytes = Math.max(0, this.stats.pendingFreedBytes - bytesFreed);
    this.stats.trashedCount += 1;

    // Remove or finalize asteroid
    const idx = this.asteroids.findIndex((a) => a.id === fileId);
    if (idx !== -1) {
      this.asteroids[idx].state = 'destroyed';
    }
  }

  public rollbackTrash(fileId: string, bytes: number): void {
    this.stats.pendingFreedBytes = Math.max(0, this.stats.pendingFreedBytes - bytes);
    const target = this.asteroids.find((a) => a.id === fileId);
    if (target && target.state === 'pending_trash') {
      target.state = 'active';
    }
  }

  public keepConfirmed(fileId: string): void {
    this.stats.keptCount += 1;
    const target = this.asteroids.find((a) => a.id === fileId);
    if (target) {
      target.state = 'destroyed';
    }
  }

  /**
   * Main deterministic simulation tick.
   */
  public update(dt: number = this.config.fixedDt): void {
    if (this.isPaused || this.isGameOver) {
      return;
    }

    const effectiveDt = dt * this.config.speedMultiplier;

    // Cooldown timers
    if (this.shootCooldown > 0) {
      this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    }

    // Ship position & boundary clamping
    this.ship.x += this.ship.vx * effectiveDt;
    if (this.ship.x < 10) {
      this.ship.x = 10;
    } else if (this.ship.x + this.ship.width > this.config.worldWidth - 10) {
      this.ship.x = this.config.worldWidth - 10 - this.ship.width;
    }

    // Spawn queued asteroids
    if (this.pendingSpawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnNextAsteroid();
        this.spawnTimer = this.spawnInterval;
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * effectiveDt;
      if (b.y < -20 || !b.alive) {
        this.bullets.splice(i, 1);
      }
    }

    // Update asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];

      if (ast.state === 'shattering') {
        ast.shatterProgress += effectiveDt * 3.5;
        if (ast.shatterProgress >= 1) {
          ast.state = 'pending_trash';
        }
      }

      if (ast.state === 'active') {
        ast.y += ast.vy * effectiveDt;
        ast.x += ast.vx * effectiveDt;
        ast.rotation += ast.rotationSpeed * effectiveDt;

        // Bounce gently off left/right walls
        if (ast.x - ast.radius < 10 && ast.vx < 0) {
          ast.vx = Math.abs(ast.vx);
        } else if (ast.x + ast.radius > this.config.worldWidth - 10 && ast.vx > 0) {
          ast.vx = -Math.abs(ast.vx);
        }

        // Check if asteroid escaped through the bottom
        if (ast.y - ast.radius > this.config.worldHeight) {
          ast.state = 'escaped';
          this.stats.escapedCount += 1;
          this.emit({
            type: 'asteroid_escaped',
            payload: { asteroid: ast },
          });
        }
      }

      // Prune dead/escaped asteroids
      if (ast.state === 'destroyed' || ast.state === 'escaped') {
        this.asteroids.splice(i, 1);
      }
    }

    // Check collisions: Bullets vs Asteroids
    this.handleCollisions();

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * effectiveDt;
      p.y += p.vy * effectiveDt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Check wave completion
    if (
      this.pendingSpawnQueue.length === 0 &&
      this.asteroids.length === 0 &&
      !this.isWaveComplete
    ) {
      this.isWaveComplete = true;
      this.emit({
        type: 'wave_complete',
        payload: { bytesFreed: this.stats.confirmedFreedBytes },
      });
    }
  }

  private spawnNextAsteroid(): void {
    const item = this.pendingSpawnQueue.shift();
    if (!item) return;

    const radius = calculateAsteroidRadius(item.file.size);
    const minX = radius + 20;
    const maxX = this.config.worldWidth - radius - 20;
    const x = this.rng.range(minX, maxX);
    const y = -radius - 10;

    const baseVy = this.rng.range(38, 62);
    const baseVx = this.rng.range(-15, 15);
    const rotSpeed = this.rng.range(-1.2, 1.2);

    const vertices = generateAsteroidVertices(
      radius,
      item.analysis.verdict,
      this.rng
    );

    const asteroid: Asteroid = {
      id: item.file.id,
      file: item.file,
      analysis: item.analysis,
      x,
      y,
      vx: baseVx,
      vy: baseVy,
      radius,
      rotation: this.rng.range(0, Math.PI * 2),
      rotationSpeed: rotSpeed,
      vertices,
      state: 'active',
      shatterProgress: 0,
    };

    this.asteroids.push(asteroid);
  }

  private handleCollisions(): void {
    for (const bullet of this.bullets) {
      if (!bullet.alive) continue;

      for (const asteroid of this.asteroids) {
        if (asteroid.state !== 'active') continue;

        if (checkBulletAsteroidCollision(bullet, asteroid)) {
          bullet.alive = false;
          this.handleAsteroidHit(asteroid);
          break;
        }
      }
    }
  }

  private handleAsteroidHit(asteroid: Asteroid): void {
    const verdict = asteroid.analysis.verdict;

    if (verdict === 'keep') {
      // Guarded keep: pause game and ask user
      asteroid.state = 'guarded';
      this.isPaused = true;
      this.stats.combo = 1; // Break combo

      this.emit({
        type: 'keep_intercepted',
        payload: {
          asteroid,
          reason: asteroid.analysis.reason,
        },
      });
      return;
    }

    // Junk or Maybe: shatter immediately
    asteroid.state = 'shattering';
    this.stats.pendingFreedBytes += asteroid.file.size;
    this.spawnExplosion(asteroid.x, asteroid.y, asteroid.radius, verdict);

    if (verdict === 'junk') {
      this.stats.combo += 1;
      if (this.stats.combo > this.stats.maxCombo) {
        this.stats.maxCombo = this.stats.combo;
      }
      this.stats.score += 100 * this.stats.combo;

      this.emit({
        type: 'junk_destroyed',
        payload: {
          asteroid,
          combo: this.stats.combo,
          bytesFreed: asteroid.file.size,
        },
      });
    } else {
      // Maybe
      this.stats.score += 50;
      this.emit({
        type: 'maybe_destroyed',
        payload: {
          asteroid,
          bytesFreed: asteroid.file.size,
        },
      });
    }
  }

  public forceDestroyGuarded(asteroidId: string): void {
    const asteroid = this.asteroids.find((a) => a.id === asteroidId);
    if (!asteroid) return;

    asteroid.state = 'shattering';
    this.stats.pendingFreedBytes += asteroid.file.size;
    this.spawnExplosion(asteroid.x, asteroid.y, asteroid.radius, 'keep');
    this.resume();

    this.emit({
      type: 'junk_destroyed',
      payload: {
        asteroid,
        combo: 1,
        bytesFreed: asteroid.file.size,
      },
    });
  }

  private spawnExplosion(
    x: number,
    y: number,
    radius: number,
    verdict: 'junk' | 'maybe' | 'keep'
  ): void {
    const baseColor =
      verdict === 'junk'
        ? '#ef4444'
        : verdict === 'maybe'
          ? '#f59e0b'
          : '#10b981';

    const count = this.config.reducedMotion
      ? 5
      : Math.min(25, Math.floor(radius / 2));

    for (let i = 0; i < count; i++) {
      const angle = this.rng.range(0, Math.PI * 2);
      const speed = this.rng.range(30, 160);
      const life = this.rng.range(0.3, 0.7);

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color: baseColor,
        radius: this.rng.range(2, 4),
      });
    }
  }
}
