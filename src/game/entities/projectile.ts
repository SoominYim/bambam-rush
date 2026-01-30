import { Projectile, Scalar, ElementType, SkillBehavior } from "../types";
import { VFXFactory } from "@/engine/vfx/VFXFactory";
import { SPELL_STATS } from "@/game/config/spellStats";
import { getTail, getPlayer } from "@/game/managers/state";
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
    angle: angle, // For orbital: current angle. For projectile: initial angle.

    update: function (deltaTime: Scalar) {
      if (behavior === SkillBehavior.PROJECTILE) {
        this.position.x += Math.cos(this.angle!) * speed * deltaTime;
        this.position.y += Math.sin(this.angle!) * speed * deltaTime;
      } else if (behavior === SkillBehavior.ORBITAL) {
        // Orbit around parent
        const tail = getTail();
        const parent = tail.find(t => t.id === this.parentID) || getPlayer();
        if (!parent) {
          this.isExpired = true;
          return;
        }

        this.angle! += CONFIG.ORBITAL_ROTATION_SPEED * deltaTime;
        this.position.x = parent.position.x + Math.cos(this.angle!) * CONFIG.ORBITAL_RADIUS;
        this.position.y = parent.position.y + Math.sin(this.angle!) * CONFIG.ORBITAL_RADIUS;
      } else if (behavior === SkillBehavior.AREA) {
        // Stationary, just check duration
        if (Date.now() - this.startTime! > this.duration!) {
          this.isExpired = true;
        }
      }

      // Trailing particles
      if (Math.random() < 0.3) {
        VFXFactory.createTrail(this.position.x, this.position.y, type);
      }

      // Projectile specialized expiration
      if (behavior === SkillBehavior.PROJECTILE) {
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
      } else {
        ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.restore();
    },
  };
};
