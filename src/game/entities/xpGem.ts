import { XPGem, Player } from "@/game/types";

export const createXPGem = (x: number, y: number, amount: number): XPGem => {
  return {
    id: crypto.randomUUID(),
    position: { x, y },
    amount,
    radius: 3 + Math.min(amount / 5, 5), // Size scales slightly with amount
    isMagnetized: false,
    update: (_deltaTime: number) => {
      // Logic handled in state.ts or here if we pass player
    },
    draw: (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.arc(x, y, 3 + Math.min(amount / 5, 5), 0, Math.PI * 2);
      ctx.fillStyle = amount >= 50 ? "#ffd700" : amount >= 10 ? "#00ffff" : "#00ff00"; // Gold, Cyan, Green
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
    this.id = crypto.randomUUID();
    this.position = { x, y };
    this.amount = amount;
    this.radius = 3 + Math.min(amount / 10, 4);
    this.isMagnetized = false;
  }

  update(deltaTime: number, player?: Player) {
    if (this.isMagnetized && player) {
      // Magnet logic: Accelerate towards player
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        // Collect logic handled in state/collisions, but can mark here?
        // Actually collision should handle collection.
        // We just move here.
      }

      const angle = Math.atan2(dy, dx);
      this.speed += this.acceleration * deltaTime;
      this.speed = Math.min(this.speed, 800); // Max speed

      this.position.x += Math.cos(angle) * this.speed * deltaTime;
      this.position.y += Math.sin(angle) * this.speed * deltaTime;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    // Color coding by amount
    if (this.amount >= 50) {
      ctx.fillStyle = "#ffd700"; // Gold (Boss/Large)
      ctx.shadowColor = "#ffd700";
    } else if (this.amount >= 10) {
      ctx.fillStyle = "#00ffff"; // Cyan (Medium)
      ctx.shadowColor = "#00ffff";
    } else {
      ctx.fillStyle = "#7af"; // Light Blue/Greenish (Small)
      ctx.shadowColor = "#7af";
    }
    // Simple glow effect for Gems (optional, can remove for performance if needed)
    // kept minimal
    ctx.fill();
  }
}
