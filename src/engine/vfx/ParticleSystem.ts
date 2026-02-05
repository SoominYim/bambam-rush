// Removed Scalar import as it's not used here.

export interface ParticleOptions {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // in seconds
  size?: number;
  color: string;
  decay?: number; // scale decay
  alpha?: number;
  gravity?: number;
  drag?: number;
  glow?: boolean;
  growth?: number; // size increase per update
  // -- Lightning Bolt support --
  points?: { x: number; y: number }[]; // Jagged line points
  width?: number;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  decay: number;
  alpha: number;
  gravity: number;
  drag: number;
  glow: boolean;
  growth: number;
  points: { x: number; y: number }[] | null;
  width: number;

  constructor(opts: ParticleOptions) {
    this.x = opts.x;
    this.y = opts.y;
    this.vx = opts.vx;
    this.vy = opts.vy;
    this.life = opts.life;
    this.maxLife = opts.life;
    this.size = opts.size || 0;
    this.color = opts.color;
    this.decay = opts.decay || 1;
    this.alpha = opts.alpha !== undefined ? opts.alpha : 1;
    this.gravity = opts.gravity || 0;
    this.drag = opts.drag || 0.98;
    this.glow = opts.glow || false;
    this.growth = opts.growth || 0;
    this.points = opts.points || null;
    this.width = opts.width || 2;
  }

  update(dt: number): boolean {
    this.vx *= Math.pow(this.drag, dt * 60);
    this.vy *= Math.pow(this.drag, dt * 60);
    this.vy += this.gravity * dt * 60;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.life -= dt;
    this.size *= Math.pow(this.decay, dt * 60);
    this.size += this.growth * dt * 60;

    return this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const lifeRatio = this.life / this.maxLife;
    ctx.globalAlpha = this.alpha * lifeRatio;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;

    if (this.points && this.points.length > 1) {
      // --- Lightning Bolt Drawing ---
      ctx.lineWidth = this.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (this.glow) {
        ctx.shadowBlur = 15 * lifeRatio;
        ctx.shadowColor = this.color;
      }

      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    } else {
      // --- Regular Circular Particle ---
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class ParticleManager {
  private particles: Particle[] = [];
  private static instance: ParticleManager;
  private readonly MAX_PARTICLES = 1000; // 화려한 연출을 위해 한도 확장

  private constructor() {}

  static getInstance(): ParticleManager {
    if (!ParticleManager.instance) {
      ParticleManager.instance = new ParticleManager();
    }
    return ParticleManager.instance;
  }

  emit(opts: ParticleOptions) {
    if (this.particles.length >= this.MAX_PARTICLES) return;
    this.particles.push(new Particle(opts));
  }

  update(dt: number) {
    // Avoid creating new arrays frequently
    let i = this.particles.length;
    while (i--) {
      if (!this.particles[i].update(dt)) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Basic setup for all particles
    ctx.save();
    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      this.particles[i].draw(ctx);
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}

export const vfx = ParticleManager.getInstance();
