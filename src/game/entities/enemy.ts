import { Enemy, Scalar, EnemyType } from "@/game/types";
import { getPlayer, addScore, addXPGem, addGold } from "@/game/managers/state";
import * as CONFIG from "@/game/config/constants";
import { damageTextManager } from "@/game/managers/damageTextManager";

export const createEnemy = (x: Scalar, y: Scalar, type: EnemyType = EnemyType.BASIC): Enemy => {
  let speed = CONFIG.ENEMY_BASE_SPEED + Math.random() * CONFIG.ENEMY_SPEED_VARIANCE;
  let hp = CONFIG.ENEMY_BASE_HP;
  let maxHp = CONFIG.ENEMY_BASE_HP;
  let size = CONFIG.ENEMY_RADIUS;
  let color = "#880000";
  let xpMin = 1;
  let xpMax = 3;

  // Apply Type Stats
  switch (type) {
    case EnemyType.FAST:
      speed *= 1.5;
      hp *= 0.6;
      maxHp *= 0.6;
      color = "#ff8800"; // Orange
      xpMin = 2;
      xpMax = 5;
      break;
    case EnemyType.TANK:
      speed *= 0.6;
      hp *= 2.5;
      maxHp *= 2.5;
      size *= 1.5;
      color = "#550000"; // Dark Red
      xpMin = 10;
      xpMax = 20;
      break;
    case EnemyType.BOSS:
      // Handled in boss.ts mostly, but if spawned here:
      speed *= 0.5;
      hp *= 50;
      maxHp *= 50;
      size *= 4;
      color = "#ff0000";
      xpMin = 500;
      xpMax = 1000;
      break;
  }

  return {
    id: `enemy_${Date.now()}_${Math.random()}`,
    position: { x, y },
    type,
    hp,
    maxHp,
    speed,
    damage: CONFIG.ENEMY_DAMAGE,
    isExpired: false,
    statusEffects: [],

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

      // --- Status Effects Processing ---
      const now = Date.now();
      this.statusEffects = this.statusEffects.filter(effect => {
        // Duration reduction
        effect.duration -= deltaTime * 1000;
        if (effect.duration <= 0) return false;

        // Tick damage
        if (now - effect.lastTick >= effect.tickInterval) {
          const tickDamage = effect.damage;
          this.hp -= tickDamage;
          effect.lastTick = now;

          // 도트 데미지 텍스트 출력
          damageTextManager.show(this.position.x, this.position.y, tickDamage, false);
        }
        return true;
      });
      // -------------------------------

      // Check if dead
      if (this.hp <= 0 && !this.isExpired) {
        this.isExpired = true;
        addScore(50); // Award score for kill

        // Award Gold (Simplified)
        let goldAmount = 1;
        if (type === EnemyType.FAST) goldAmount = 2;
        if (type === EnemyType.TANK) goldAmount = 10;
        if (type === EnemyType.BOSS) goldAmount = 100;
        addGold(goldAmount);

        // Drop XP Gem based on type
        const xpAmount = Math.floor(xpMin + Math.random() * (xpMax - xpMin + 1));
        addXPGem(this.position.x, this.position.y, xpAmount);
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save();

      // Reset all canvas states
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, size, 0, Math.PI * 2);

      // BURN 상태일 때 시각 효과
      const isBurning = this.statusEffects.some(e => e.type === "BURN");
      if (isBurning) {
        ctx.fillStyle = "#ff6600"; // 화상 시 주황색
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0000";
      } else {
        ctx.fillStyle = color;
      }

      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();

      // HP Bar (Clamped to prevent negative overflow)
      const hpPct = Math.max(0, Math.min(1, this.hp / this.maxHp));
      ctx.fillStyle = "#f00";
      ctx.fillRect(this.position.x - size, this.position.y - size - 10, size * 2 * hpPct, 4);

      ctx.restore();
    },
  };
};
