import { Collectible, CollectibleType, Scalar } from "@/game/types";
import { COLLECTION_RADIUS, COLLECTION_SCORE } from "@/game/config/constants";
import { addCollectible, getPlayer, addScore } from "@/game/managers/state";

export const createCollectible = (x: Scalar, y: Scalar, type: CollectibleType): Collectible => {
  return {
    id: `collectible_${Date.now()}_${Math.random()}`,
    position: { x, y },
    type,
    radius: 12,
    isExpired: false,

    update: function (_deltaTime: Scalar) {
      // Check distance to player for collection
      const player = getPlayer();
      if (player && !this.isExpired) {
        const dx = this.position.x - player.position.x;
        const dy = this.position.y - player.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Pickup range applies for collectibles too? Usually collectibles are fixed range,
        // but maybe Magnet affects them? Standard games: yes.
        // For now, let's stick to standard COLLECTION_RADIUS unless we want Magnet to pull them too.
        // Let's make them attractable later if needed. For now, walk over them.

        if (distance < COLLECTION_RADIUS) {
          // Mark for collection
          this.isExpired = true;
          // Score is added, effect is applied in player.ts checkCollection
          addScore(COLLECTION_SCORE);
        }
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save();

      // Reset canvas states
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      let icon = "❓";
      let color = "#fff";

      switch (this.type) {
        case CollectibleType.MAGNET:
          icon = "🧲";
          color = "#ff4444";
          break;
        case CollectibleType.POTION:
          icon = "🧪";
          color = "#44ff44";
          break;
        case CollectibleType.BOOM:
          icon = "💣";
          color = "#444444";
          break;
      }

      // 1. Draw Background Circle
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Border
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius + 4, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // 2. Draw Emoji
      ctx.font = `${this.radius * 1.8}px "Segoe UI Emoji", Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(icon, this.position.x, this.position.y);

      ctx.restore();
    },
  };
};

export const spawnRandomCollectible = (x?: number, y?: number) => {
  const posX = x ?? Math.random() * 3800 + 100;
  const posY = y ?? Math.random() * 3800 + 100;

  // Weighted Random?
  const rand = Math.random();
  let type = CollectibleType.POTION;

  if (rand < 0.4) {
    type = CollectibleType.POTION; // 40%
  } else if (rand < 0.7) {
    type = CollectibleType.MAGNET; // 30%
  } else {
    type = CollectibleType.BOOM; // 30%
  }

  const collectible = createCollectible(posX, posY, type);
  addCollectible(collectible);
};
