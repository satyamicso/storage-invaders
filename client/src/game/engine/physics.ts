import type { Asteroid, Bullet, Ship, AsteroidVertex } from './types';
import type { SeededRNG } from './rng';

export function calculateAsteroidRadius(
  sizeBytes: number,
  minRadius = 24,
  maxRadius = 60
): number {
  if (sizeBytes <= 0) return minRadius;
  // Log10 of bytes: 1KB ~ 3, 1MB ~ 6, 1GB ~ 9, 10GB ~ 10
  const logVal = Math.log10(Math.max(1024, sizeBytes));
  const minLog = 3; // 1 KB
  const maxLog = 10; // 10 GB
  const normalized = Math.min(1, Math.max(0, (logVal - minLog) / (maxLog - minLog)));
  return minRadius + normalized * (maxRadius - minRadius);
}

export function generateAsteroidVertices(
  radius: number,
  verdict: 'junk' | 'maybe' | 'keep',
  rng: SeededRNG
): AsteroidVertex[] {
  // Junk has jagged irregular shape; Maybe is rounded polygon; Keep is smooth geometric crystal
  const vertexCount = verdict === 'junk' ? 10 : verdict === 'maybe' ? 8 : 6;
  const vertices: AsteroidVertex[] = [];
  const step = (Math.PI * 2) / vertexCount;

  for (let i = 0; i < vertexCount; i++) {
    const angle = i * step;
    let irregularity = 0;
    if (verdict === 'junk') {
      irregularity = rng.range(-radius * 0.35, radius * 0.25);
    } else if (verdict === 'maybe') {
      irregularity = rng.range(-radius * 0.15, radius * 0.15);
    } else {
      irregularity = rng.range(-radius * 0.05, radius * 0.05);
    }
    vertices.push({
      angle,
      distance: Math.max(radius * 0.6, radius + irregularity),
    });
  }
  return vertices;
}

export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distSq = dx * dx + dy * dy;
  const radSum = r1 + r2;
  return distSq <= radSum * radSum;
}

export function checkBulletAsteroidCollision(
  bullet: Bullet,
  asteroid: Asteroid
): boolean {
  return checkCircleCollision(
    bullet.x,
    bullet.y,
    bullet.radius,
    asteroid.x,
    asteroid.y,
    asteroid.radius
  );
}

export function checkShipAsteroidCollision(
  ship: Ship,
  asteroid: Asteroid
): boolean {
  // Approximate ship as circle centered in ship bounding box
  const shipCenterX = ship.x + ship.width / 2;
  const shipCenterY = ship.y + ship.height / 2;
  const shipRadius = Math.min(ship.width, ship.height) / 2;
  return checkCircleCollision(
    shipCenterX,
    shipCenterY,
    shipRadius,
    asteroid.x,
    asteroid.y,
    asteroid.radius
  );
}
