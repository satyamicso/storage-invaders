import type { GameEngine } from '../engine/engine';
import type { Asteroid, Ship, Bullet, Particle } from '../engine/types';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Array<{ x: number; y: number; size: number; alpha: number; speed: number }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
    this.initStars(80);
  }

  private initStars(count: number): void {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 20 + 10,
      });
    }
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.initStars(80);
  }

  public render(engine: GameEngine, hoveredAsteroidId?: string | null): void {
    const { ctx, canvas } = this;
    const { worldWidth, worldHeight } = engine.config;

    // Clear frame
    ctx.fillStyle = '#090d16'; // Deep cosmic navy/black
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale canvas to match engine coordinate space
    const scaleX = canvas.width / worldWidth;
    const scaleY = canvas.height / worldHeight;
    ctx.save();
    ctx.scale(scaleX, scaleY);

    // 1. Draw animated background starfield
    this.renderStars(worldWidth, worldHeight, engine.config.fixedDt);

    // 2. Draw particles
    this.renderParticles(engine.particles);

    // 3. Draw active asteroids
    for (const asteroid of engine.asteroids) {
      if (asteroid.state === 'active' || asteroid.state === 'guarded' || asteroid.state === 'shattering') {
        const isHovered = hoveredAsteroidId === asteroid.id;
        this.renderAsteroid(asteroid, isHovered);
      }
    }

    // 4. Draw bullets
    this.renderBullets(engine.bullets);

    // 5. Draw player ship
    this.renderShip(engine.ship);

    ctx.restore();
  }

  private renderStars(width: number, height: number, dt: number): void {
    const { ctx } = this;
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  private renderShip(ship: Ship): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);

    // Thruster engine flame (procedural flicker)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    const flameHeight = Math.random() * 10 + 12;
    ctx.moveTo(-ship.width * 0.22, ship.height * 0.4);
    ctx.lineTo(0, ship.height * 0.4 + flameHeight);
    ctx.lineTo(ship.width * 0.22, ship.height * 0.4);
    ctx.closePath();
    ctx.fill();

    // Ship hull (sleek cyber fighter)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(0, -ship.height * 0.55); // Nose tip
    ctx.lineTo(ship.width * 0.5, ship.height * 0.4); // Right wing tip
    ctx.lineTo(ship.width * 0.2, ship.height * 0.3); // Right inner notch
    ctx.lineTo(-ship.width * 0.2, ship.height * 0.3); // Left inner notch
    ctx.lineTo(-ship.width * 0.5, ship.height * 0.4); // Left wing tip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit canopy glow
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, -ship.height * 0.1, ship.width * 0.14, ship.height * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderBullets(bullets: Bullet[]): void {
    const { ctx } = this;
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    for (const b of bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Laser energy tail
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x, b.y + 12);
      ctx.stroke();
    }

    ctx.shadowBlur = 0; // Reset
  }

  private renderAsteroid(ast: Asteroid, isHovered: boolean): void {
    const { ctx } = this;
    const { verdict } = ast.analysis;

    // Visual Palette & multi-attribute WCAG coding:
    // Junk = Crimson (#ef4444) + X pattern
    // Maybe = Amber (#f59e0b) + ? mark
    // Keep = Emerald/Gold (#10b981 / #fbbf24) + Shield icon
    let strokeColor = '#ef4444';
    let fillColor = '#1c0f13';
    let iconSymbol = '✕';

    if (verdict === 'maybe') {
      strokeColor = '#f59e0b';
      fillColor = '#1c170a';
      iconSymbol = '?';
    } else if (verdict === 'keep') {
      strokeColor = '#10b981';
      fillColor = '#091c14';
      iconSymbol = '🛡';
    }

    if (ast.state === 'guarded') {
      strokeColor = '#fbbf24';
      fillColor = '#241a06';
    }

    ctx.save();
    ctx.translate(ast.x, ast.y);

    // Shattering animation fade
    if (ast.state === 'shattering') {
      ctx.globalAlpha = Math.max(0, 1 - ast.shatterProgress);
      const scale = 1 + ast.shatterProgress * 0.5;
      ctx.scale(scale, scale);
    }

    // Outer polygonal jagged body
    ctx.rotate(ast.rotation);
    ctx.beginPath();
    for (let i = 0; i < ast.vertices.length; i++) {
      const v = ast.vertices[i];
      const vx = Math.cos(v.angle) * v.distance;
      const vy = Math.sin(v.angle) * v.distance;
      if (i === 0) {
        ctx.moveTo(vx, vy);
      } else {
        ctx.lineTo(vx, vy);
      }
    }
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = isHovered ? '#ffffff' : strokeColor;
    ctx.lineWidth = isHovered ? 3.5 : 2.2;
    if (isHovered) {
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Interior pattern / non-color symbol
    ctx.rotate(-ast.rotation); // Keep icon upright
    ctx.fillStyle = strokeColor;
    ctx.font = `bold ${Math.max(14, Math.floor(ast.radius * 0.65))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconSymbol, 0, -2);

    // Label: File Name (truncated) and Size
    const nameStr =
      ast.file.name.length > 14
        ? ast.file.name.substring(0, 12) + '…'
        : ast.file.name;
    const sizeStr = formatBytes(ast.file.size);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nameStr, 0, ast.radius + 14);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(sizeStr, 0, ast.radius + 26);

    ctx.restore();
  }

  private renderParticles(particles: Particle[]): void {
    const { ctx } = this;
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  public getAsteroidAt(
    asteroids: Asteroid[],
    canvasX: number,
    canvasY: number,
    worldWidth: number,
    worldHeight: number
  ): Asteroid | null {
    const scaleX = this.canvas.width / worldWidth;
    const scaleY = this.canvas.height / worldHeight;
    const worldX = canvasX / scaleX;
    const worldY = canvasY / scaleY;

    for (const ast of asteroids) {
      if (ast.state !== 'active' && ast.state !== 'guarded') continue;
      const dx = worldX - ast.x;
      const dy = worldY - ast.y;
      if (dx * dx + dy * dy <= ast.radius * ast.radius) {
        return ast;
      }
    }
    return null;
  }
}
