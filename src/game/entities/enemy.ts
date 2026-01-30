import { Enemy, Scalar } from "../types";
import { getPlayer, addScore } from "../gameState";
import * as CONFIG from "../constants";

export const createEnemy = (x: Scalar, y: Scalar): Enemy => {
  const speed = CONFIG.ENEMY_BASE_SPEED + Math.random() * CONFIG.ENEMY_SPEED_VARIANCE;

  return {
    id: `enemy_${Date.now()}_${Math.random()}`,
    position: { x, y },
    hp: CONFIG.ENEMY_BASE_HP,
    maxHp: CONFIG.ENEMY_BASE_HP,
    speed,
    damage: CONFIG.ENEMY_DAMAGE,
    isExpired: false,

    update: function (deltaTime: Scalar) {
      const player = getPlayer();
      if (!player) return;

      // Chase Player
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        const moveX = dx / dist;
        const moveY = dy / dist;

        this.position.x += moveX * this.speed * deltaTime;
        this.position.y += moveY * this.speed * deltaTime;
      }

      // Check if dead
      if (this.hp <= 0 && !this.isExpired) {
        this.isExpired = true;
        addScore(50); // Award score for kill
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, CONFIG.ENEMY_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#880000";
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.stroke();

      // HP Bar
      const hpPct = this.hp / this.maxHp;
      ctx.fillStyle = "#f00";
      ctx.fillRect(this.position.x - 10, this.position.y - 25, 20 * hpPct, 4);
    },
  };
};
