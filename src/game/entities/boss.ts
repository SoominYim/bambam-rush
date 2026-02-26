import { Enemy, Scalar, EnemyType } from "@/game/types";
import { getPlayer, addScore, addXPGem } from "@/game/managers/state";
import * as CONFIG from "@/game/config/constants";
import { damageTextManager } from "@/game/managers/damageTextManager";

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

      // Status Effects Check (Movement)
      const isFrozen = this.statusEffects.some(e => e.type === ("FREEZE" as any));
      const chillEffect = this.statusEffects.find(e => e.type === ("CHILL" as any));

      let currentSpeed = this.speed;
      if (isFrozen) {
        currentSpeed *= 0.7; // 보스는 빙결 시 30% 감속 (저항력 증가)
      }
      if (chillEffect) {
        currentSpeed *= 1 - (chillEffect.value || 0.3); // 둔화 적용
      }

      if (dist > 5) {
        const moveX = dx / dist;
        const moveY = dy / dist;

        this.position.x += moveX * currentSpeed * deltaTime;
        this.position.y += moveY * currentSpeed * deltaTime;
      }

      // --- Status Effects Processing ---
      const now = Date.now();
      this.statusEffects = this.statusEffects.filter(effect => {
        // Duration reduction
        effect.duration -= deltaTime * 1000;
        if (effect.duration <= 0) return false;

        // Tick damage
        if (now - effect.lastTick >= effect.tickInterval) {
          const rawDamage = effect.damage;
          // 방어력 적용 (보스 방어력 적용)
          const finalDamage = Math.max(1, rawDamage - (this.defense || 0));

          this.hp -= finalDamage;
          effect.lastTick = now;

          // 도트 데미지 텍스트 출력
          damageTextManager.show(this.position.x, this.position.y, finalDamage, false);
        }
        return true;
      });

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

      const isFrozen = this.statusEffects.some(e => e.type === ("FREEZE" as any));
      const isChilled = this.statusEffects.some(e => e.type === ("CHILL" as any));
      const isPoisoned = this.statusEffects.some(e => e.type === ("POISON" as any));

      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, size, 0, Math.PI * 2);

      if (isFrozen) {
        ctx.fillStyle = "#00ffff"; // Freeze
        ctx.shadowColor = "#0088ff";
      } else if (isChilled) {
        ctx.fillStyle = "#0088ff"; // Chill
        ctx.shadowColor = "#00ffff";
      } else if (isPoisoned) {
        ctx.fillStyle = "#aa00ff"; // Poison
        ctx.shadowColor = "#8800ff";
      } else {
        ctx.fillStyle = "#ff0000"; // Default Boss Red
      }

      ctx.fill();

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // W19 phase mark overlay for boss
      const markUntil = (this as any).__phaseMarkUntil || 0;
      const now = Date.now();
      if (markUntil > now) {
        const t = Math.max(0, Math.min(1, (markUntil - now) / 3000));
        const pulse = 1 + Math.sin(now * 0.018) * 0.08;
        const rr = size * (1.22 + (1 - t) * 0.2) * pulse;

        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(158, 120, 255, ${0.35 + t * 0.55})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.position.x - rr * 0.42, this.position.y);
        ctx.lineTo(this.position.x + rr * 0.42, this.position.y);
        ctx.moveTo(this.position.x, this.position.y - rr * 0.42);
        ctx.lineTo(this.position.x, this.position.y + rr * 0.42);
        ctx.strokeStyle = `rgba(235, 225, 255, ${0.45 + t * 0.45})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

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
