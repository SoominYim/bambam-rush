import { GameObject, Vector2D, SpellType } from '../../types';

export class Projectile implements GameObject {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  type: SpellType;
  radius: number = 8;
  damage: number = 10;
  isExpired: boolean = false;
  lifeTime: number = 2.0; // Seconds

  // Visual properties
  color: string;
  trail: Vector2D[] = [];

  constructor(x: number, y: number, angle: number, type: SpellType) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.position = { x, y };
    this.type = type;

    let speed = 400;
    this.color = '#fff';

    switch (type) {
      case SpellType.FIRE:
        this.color = '#ff4400';
        speed = 500;
        this.radius = 10;
        break;
      case SpellType.WATER:
        this.color = '#0088ff';
        speed = 350;
        this.radius = 12;
        break;
      case SpellType.ICE:
        this.color = '#00ffff';
        speed = 300;
        this.radius = 8;
        break;
      case SpellType.WIND:
        this.color = '#ccffcc';
        speed = 600;
        this.radius = 6;
        break;
    }

    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
  }

  update(deltaTime: number) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    this.lifeTime -= deltaTime;
    if (this.lifeTime <= 0) {
      this.isExpired = true;
    }

    // Add trail effect
    this.trail.push({ ...this.position });
    if (this.trail.length > 10) {
      this.trail.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw trail
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
        const point = this.trail[i];
        ctx.lineTo(point.x, point.y);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw projectile
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
  }
}
