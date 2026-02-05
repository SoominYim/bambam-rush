import { Projectile, Scalar, ElementType, SkillBehavior } from "../types";
import { SPELL_STATS } from "@/game/config/spellStats";
import { updateProjectileBehavior } from "./projectileBehaviors";
import * as CONFIG from "@/game/config/constants";

export const createProjectile = (
  x: Scalar,
  y: Scalar,
  angle: number,
  type: ElementType,
  tier: number = 1,
  behavior: SkillBehavior = SkillBehavior.PROJECTILE,
  parentID?: string,
): Projectile => {
  const stats = SPELL_STATS[type];
  const speed = stats.speed + (tier - 1) * CONFIG.PROJECTILE_SPEED_PER_TIER;
  const radius = stats.size / 2 + (tier - 1) * CONFIG.PROJECTILE_RADIUS_PER_TIER;
  const damage = stats.damage * tier;
  const color = stats.color;

  return {
    id: `skill_${Date.now()}_${Math.random()}`,
    type,
    position: { x, y },
    damage,
    penetration: stats.penetration !== undefined ? stats.penetration : tier >= 2 ? 2 : 1,
    isExpired: false,
    parentID,
    startTime: Date.now(),
    duration: stats.duration || (behavior === SkillBehavior.AREA ? CONFIG.AREA_DURATION_BASE : 0),
    hitTracker: {}, // Initialize
    angle: angle,

    update: function (deltaTime: Scalar) {
      // --- Range Limit Check ---
      if ((this as any).range) {
        if (!(this as any).startPos) {
          (this as any).startPos = { x: this.position.x, y: this.position.y };
        }
        const start = (this as any).startPos;
        const distSq = Math.pow(this.position.x - start.x, 2) + Math.pow(this.position.y - start.y, 2);
        if (distSq > Math.pow((this as any).range, 2)) {
          this.isExpired = true;
          return;
        }
      }
      // -------------------------

      // 새로운 행동 시스템 사용
      if ((this as any).behavior) {
        updateProjectileBehavior(this, deltaTime);
      } else {
        // 기존 SkillBehavior 호환성 유지
        if (behavior === SkillBehavior.PROJECTILE) {
          this.position.x += Math.cos(this.angle!) * speed * deltaTime;
          this.position.y += Math.sin(this.angle!) * speed * deltaTime;
        } else if (behavior === SkillBehavior.AREA) {
          // Stationary, just check duration
          if (Date.now() - this.startTime! > this.duration!) {
            this.isExpired = true;
          }
        }
      }

      // Projectile expiration check
      if (behavior === SkillBehavior.PROJECTILE || (this as any).behavior) {
        const margin = 500;
        if (
          this.position.x < -margin ||
          this.position.x > CONFIG.WORLD_WIDTH + margin ||
          this.position.y < -margin ||
          this.position.y > CONFIG.WORLD_HEIGHT + margin
        ) {
          this.isExpired = true;
        }
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = behavior === SkillBehavior.AREA ? 20 : 0;
      ctx.shadowColor = color;

      ctx.beginPath();
      if (behavior === SkillBehavior.AREA) {
        ctx.arc(this.position.x, this.position.y, stats.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}33`; // Transparent fill for area
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (type === ElementType.SWORD) {
        // Handle visibility for ORBIT_STAB behavior
        const p = this as any;
        if (p.behavior === "ORBIT_STAB") {
          if (p.state === "ORBIT") {
            ctx.restore();
            return;
          }
          // Optional: Fade out during RECOVER
          if (p.state === "RECOVER") {
            const baseRadius = p.orbitRadiusBase || 60;
            const stabRange = p.stabRange || 100;
            const progress = (p.orbitRadiusCurrent - baseRadius) / stabRange; // 1 -> 0
            ctx.globalAlpha = Math.max(0, progress);
          }
        }

        // Draw Sword Shape (Corrected)
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle || 0);

        // Dynamic Radius (Visual Size from WeaponSystem)
        const r = (this as any).radius || 10;

        // Blade (Long and thin)
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(0, -r * 0.2, r * 3.0, r * 0.4);

        // Fuller (Groove in blade)
        ctx.fillStyle = "#a0a0a0";
        ctx.fillRect(r * 0.2, -r * 0.05, r * 2.5, r * 0.1);

        // Guard (Crossguard)
        ctx.fillStyle = "#daa520"; // Gold
        ctx.fillRect(-r * 0.2, -r * 0.8, r * 0.4, r * 1.6);

        // Handle (Grip)
        ctx.fillStyle = "#8b4513"; // Brown
        ctx.fillRect(-r * 1.0, -r * 0.2, r * 0.8, r * 0.4);

        // Pommel (End cap)
        ctx.fillStyle = "#daa520";
        ctx.fillRect(-r * 1.2, -r * 0.3, r * 0.3, r * 0.6);
      } else {
        ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.restore();
    },
  };
};
