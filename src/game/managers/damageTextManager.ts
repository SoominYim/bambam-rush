export interface DamageText {
  id: string;
  x: number;
  y: number;
  damage: number;
  life: number; // seconds
  maxLife: number;
  velocity: { x: number; y: number };
  color: string;
  scale: number;
}

class DamageTextManager {
  private texts: DamageText[] = [];
  private static instance: DamageTextManager;

  private constructor() {}

  static getInstance(): DamageTextManager {
    if (!DamageTextManager.instance) {
      DamageTextManager.instance = new DamageTextManager();
    }
    return DamageTextManager.instance;
  }

  show(x: number, y: number, damage: number, isCritical: boolean = false) {
    this.texts.push({
      id: crypto.randomUUID(),
      x: x + (Math.random() - 0.5) * 20, // Random offset
      y: y - 20,
      damage: Math.floor(damage),
      life: 0.8,
      maxLife: 0.8,
      velocity: {
        x: (Math.random() - 0.5) * 30,
        y: -50 - Math.random() * 30, // Float up
      },
      color: isCritical ? "#ff0000" : "#ffffff",
      scale: isCritical ? 1.5 : 1.0,
    });
  }

  update(dt: number) {
    this.texts.forEach(t => {
      t.x += t.velocity.x * dt;
      t.y += t.velocity.y * dt;
      t.life -= dt;
      // Slight gravity/friction
      t.velocity.y += 50 * dt;
    });

    this.texts = this.texts.filter(t => t.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this.texts.forEach(t => {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;

      const fontSize = Math.floor(16 * t.scale);
      ctx.font = `800 ${fontSize}px 'Outfit', sans-serif`;

      // Stroke for better visibility
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 3;
      ctx.strokeText(t.damage.toString(), t.x, t.y);

      ctx.fillStyle = t.color;
      ctx.fillText(t.damage.toString(), t.x, t.y);
    });

    ctx.restore();
  }

  clear() {
    this.texts = [];
  }
}

export const damageTextManager = DamageTextManager.getInstance();
