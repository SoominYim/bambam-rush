import { XPGem, Player } from "@/game/types";

export const createXPGem = (x: number, y: number, amount: number): XPGem => {
  return {
    id: `xp_${Date.now()}_${Math.random()}`,
    position: { x, y },
    amount,
    radius: 3 + Math.min(amount / 5, 5),
    isMagnetized: false,
    update: (_deltaTime: number) => {},
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.arc(x, y, 3 + Math.min(amount / 5, 5), 0, Math.PI * 2);
      ctx.fillStyle = amount >= 50 ? "#ffd700" : amount >= 10 ? "#00ffff" : "#00ff00";
      ctx.fill();
    },
  };
};

export class XPGemInstance implements XPGem {
  id: string;
  position: { x: number; y: number };
  amount: number;
  radius: number;
  isMagnetized: boolean = false;
  isExpired: boolean = false;
  speed: number = 0;
  acceleration: number = 500;

  constructor(x: number, y: number, amount: number) {
    this.id = `xp_${Date.now()}_${Math.random()}`;
    this.position = { x, y };
    this.amount = amount;
    this.radius = 3 + Math.min(amount / 10, 4);
    this.isMagnetized = false;
  }

  update(deltaTime: number, player?: Player) {
    if (this.isMagnetized && player) {
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) return;

      // 1. Calculate direction
      const dirX = dx / dist;
      const dirY = dy / dist;

      // 2. Consistent Acceleration
      // Once magnetized, we don't want it to slow down just because it's "far".
      // We want it to accelerate harder when close, but keep a strong base pull.
      const magnetPower = player.stats.magnetPower || 500;

      // Minimum speed floor: Ensure it's always at least as fast as the player + a margin
      // This prevents the "falling behind" feeling when the player moves away.
      const playerSpeed = 180 * (player.stats.speed || 1);
      const minSpeed = playerSpeed * 1.2;

      if (this.speed < minSpeed) {
        this.speed = minSpeed;
      }

      // Stronger acceleration when closer for the "sucking" effect
      const acceleration = magnetPower * (dist < 150 ? 3 : 1);
      this.speed += acceleration * deltaTime;

      // Cap speed to prevent astronomical values but keep it very high
      this.speed = Math.min(this.speed, 1500);

      // 3. Apply movement
      this.position.x += dirX * this.speed * deltaTime;
      this.position.y += dirY * this.speed * deltaTime;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const scale = this.isMagnetized ? 1.2 : 1.0;
    const x = this.position.x;
    const y = this.position.y;
    const r = this.radius * scale;

    ctx.save();

    // Simple glow for magnetized gems
    if (this.isMagnetized) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.amount >= 50 ? "#ffd700" : this.amount >= 10 ? "#00ffff" : "#7af";
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);

    // Color coding by amount
    if (this.amount >= 50) {
      ctx.fillStyle = "#ffd700"; // Gold (Boss/Large)
    } else if (this.amount >= 10) {
      ctx.fillStyle = "#00ffff"; // Cyan (Medium)
    } else {
      ctx.fillStyle = "#7af"; // Light Blue/Greenish (Small)
    }

    ctx.fill();
    ctx.restore();
  }
}
