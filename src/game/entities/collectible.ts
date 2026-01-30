import { Collectible, ElementType, Scalar } from "../types";
import { COLLECTION_RADIUS, COLLECTION_SCORE } from "../constants";
import { addCollectible, getPlayer, addScore } from "../gameState";

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
      this.position.y += Math.sin(Date.now() / 200) * 0.5;
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      let color = "#ccc";
      switch (this.type) {
        case ElementType.FIRE:
          color = "#ff4400";
          break;
        case ElementType.WATER:
          color = "#0088ff";
          break;
        case ElementType.ICE:
          color = "#00ffff";
          break;
        case ElementType.WIND:
          color = "#ccffcc";
          break;
      }

      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  };
};

export const spawnRandomCollectible = (x?: number, y?: number) => {
  const posX = x ?? Math.random() * 3800 + 100; // Default to world bounds
  const posY = y ?? Math.random() * 3800 + 100;

  const types = [ElementType.FIRE, ElementType.WATER, ElementType.ICE, ElementType.WIND];
  const type = types[Math.floor(Math.random() * types.length)];

  const collectible = createCollectible(posX, posY, type);
  addCollectible(collectible);
};
