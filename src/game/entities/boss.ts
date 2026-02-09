import { Enemy, Scalar, EnemyType } from "@/game/types";
import { getPlayer, addScore, addXPGem } from "@/game/managers/state";
import * as CONFIG from "@/game/config/constants";

export const createBoss = (x: Scalar, y: Scalar): Enemy => {
  const speed = CONFIG.ENEMY_BASE_SPEED * 0.5; // Boss is slower

  return {
    id: `boss_${Date.now()}_${Math.random()}`,
    position: { x, y },
    hp: CONFIG.ENEMY_BASE_HP * 50, // 50x HP
    maxHp: CONFIG.ENEMY_BASE_HP * 50,
    speed,
    damage: CONFIG.ENEMY_DAMAGE * 3, // 3x Damage
    defense: 10, // 보스는 높은 방어력을 가짐
    statusEffects: [], // 상태 효과 배열 초기화
    isExpired: false,
    type: EnemyType.BOSS,

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
        addScore(5000); // Massive score for boss

        // Drop Massive XP
        // Boss drops 1000 XP (effectively a guaranteed level up or two)
        addXPGem(this.position.x, this.position.y, 1000);

        // TODO: Win condition or specific Boss Drop?
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save();

      const size = CONFIG.ENEMY_RADIUS * 4; // 4x Size

      // Boss Aura/Glow
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ff0000";
      ctx.globalAlpha = 1.0;

      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, size, 0, Math.PI * 2);
      ctx.fillStyle = "#ff0000";
      ctx.fill();

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Skull or detail marking
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(this.position.x - size / 3, this.position.y - size / 4, size / 6, 0, Math.PI * 2); // Left Eye
      ctx.arc(this.position.x + size / 3, this.position.y - size / 4, size / 6, 0, Math.PI * 2); // Right Eye
      ctx.fill();

      // HP Bar (Boss needs a bigger bar)
      const hpPct = this.hp / this.maxHp;
      ctx.fillStyle = "#333";
      ctx.fillRect(this.position.x - size, this.position.y - size - 20, size * 2, 8); // BG
      ctx.fillStyle = "#f00";
      ctx.fillRect(this.position.x - size, this.position.y - size - 20, size * 2 * hpPct, 8); // FG

      ctx.restore();
    },
  };
};
