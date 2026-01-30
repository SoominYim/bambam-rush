import { Collectible, ElementType, Scalar } from "@/game/types";
import { COLLECTION_RADIUS, COLLECTION_SCORE } from "@/game/config/constants";
import { addCollectible, getPlayer, addScore } from "@/game/managers/state";

export const createCollectible = (x: Scalar, y: Scalar, type: ElementType): Collectible => {
  return {
    id: `collectible_${Date.now()}_${Math.random()}`,
    position: { x, y },
    type,
    tier: 1,
    radius: 10,
    isExpired: false,

    update: function (_deltaTime: Scalar) {
      // Check distance to player for collection
      const player = getPlayer();
      if (player && !this.isExpired) {
        const dx = this.position.x - player.position.x;
        const dy = this.position.y - player.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < COLLECTION_RADIUS) {
          // Mark for collection
          this.isExpired = true;
          addScore(COLLECTION_SCORE);
        }
      }

      // Floating animation
      // No more float/jitter animation to prevent flickering
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save(); // Isolate rendering state

      // Reset canvas states
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 1. Get Emoji from Recipe Data
      let icon = "❓";
      let color = "#fff";

      switch (this.type) {
        case ElementType.FIRE:
          icon = "🔥";
          color = "#ff4400";
          break;
        case ElementType.WATER:
          icon = "💧";
          color = "#0088ff";
          break;
        case ElementType.ICE:
          icon = "❄️";
          color = "#00ffff";
          break;
        case ElementType.WIND:
          icon = "💨";
          color = "#00ff88";
          break;
        case ElementType.POISON:
          icon = "☠️";
          color = "#aa00ff";
          break;
        case ElementType.ELECTRIC:
          icon = "⚡";
          color = "#ffdd00";
          break;
        case ElementType.SWORD:
          icon = "🗡️";
          color = "#cccccc";
          break;
        case ElementType.BOOK:
          icon = "📖";
          color = "#885522";
          break;
      }

      // 1. Draw Background Circle (Solid & Visible)
      ctx.beginPath();
      // Make radius slightly larger
      ctx.arc(this.position.x, this.position.y, this.radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.fill();

      // Border
      ctx.beginPath(); // CRITICAL: Reset path to prevent redrawing background
      ctx.arc(this.position.x, this.position.y, this.radius + 4, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.globalAlpha = 1.0;
      ctx.stroke();

      // 2. Draw Emoji
      ctx.font = `${this.radius * 2.0}px "Segoe UI Emoji", Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#fff";

      ctx.fillText(icon, this.position.x, this.position.y + 1);

      ctx.restore(); // Restore canvas state
    },
  };
};

export const spawnRandomCollectible = (x?: number, y?: number) => {
  const posX = x ?? Math.random() * 3800 + 100; // Default to world bounds
  const posY = y ?? Math.random() * 3800 + 100;

  const types = [
    ElementType.FIRE,
    ElementType.WATER,
    ElementType.ICE,
    ElementType.WIND,
    ElementType.POISON,
    ElementType.ELECTRIC,
    ElementType.SWORD,
    ElementType.BOOK,
  ];
  const type = types[Math.floor(Math.random() * types.length)];

  const collectible = createCollectible(posX, posY, type);
  addCollectible(collectible);
};
