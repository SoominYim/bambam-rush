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
        // Pommel (End cap)
        ctx.fillStyle = "#daa520";
        ctx.fillRect(-r * 1.2, -r * 0.3, r * 0.3, r * 0.6);
      } else if (type === ElementType.WIND) {
        // --- Boomerang (Wind) Drawing ---
        const rotation = (this as any).visualAngle || this.angle || 0;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(rotation);

        const r = (this as any).radius || 15;

        // V-Shape Boomerang
        ctx.beginPath();
        ctx.fillStyle = "#87CEFA"; // Light Sky Blue
        // Top Wing
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.5, -r * 0.5, r, -r); // Tip
        ctx.quadraticCurveTo(r * 0.2, -r * 0.2, 0, -r * 0.4); // Inner arc
        // Bottom Wing
        ctx.quadraticCurveTo(-r * 0.2, -r * 0.2, -r, -r); // Tip (Wait, this logic draws 2 wings? Boomerang usually has 2 wings)
        // Let's redraw: Center is (0,0). Wings go out.
        // Wing 1
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.5, -r * 0.2, r, -r * 0.8);
        ctx.quadraticCurveTo(r * 0.2, -r * 0.5, 0, -r * 0.2);
        // Wing 2
        ctx.quadraticCurveTo(-r * 0.5, 0.2, -r, 0.8);
        ctx.quadraticCurveTo(-r * 0.2, 0.5, 0, 0.2);
        ctx.fill();

        // Better Boomerang Shape: 3-blade or 2-blade?
        // Standard 2-blade V shape:
        ctx.beginPath();
        ctx.fillStyle = "#E0FFFF"; // Light Cyan
        const width = r * 0.3;
        const length = r;

        ctx.moveTo(width, 0);
        ctx.quadraticCurveTo(width, -length / 2, length, -length); // Wing 1 Tip
        ctx.quadraticCurveTo(0, -width, -width, 0); // Center Inner
        ctx.quadraticCurveTo(0, width, length, length); // Wing 2 Tip
        ctx.quadraticCurveTo(width, length / 2, width, 0); // Center Outer
        ctx.fill();

        // Wind Trail / Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00BFFF";
      } else if (type === ElementType.POISON && (this as any).behavior === "BOTTLE") {
        // --- Poison Bottle Drawing (원근법 적용) ---
        const p = this as any;
        const visualY = -(p.arcHeight || 0);
        const scale = p.visualScale || 1.0;

        ctx.translate(this.position.x, this.position.y + visualY);
        ctx.scale(scale, scale); // 원근법: 공중에 뜰수록 커짐
        ctx.rotate(this.angle || 0);

        const w = 12;
        const h = 16;

        // 1. Bottle Body
        ctx.fillStyle = "#6a00b0";
        ctx.beginPath();
        // ctx.roundRect fallback
        const r = 3;
        ctx.moveTo(-w / 2 + r, -h / 2);
        ctx.lineTo(w / 2 - r, -h / 2);
        ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
        ctx.lineTo(w / 2, h / 2 - r);
        ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        ctx.lineTo(-w / 2 + r, h / 2);
        ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
        ctx.lineTo(-w / 2, -h / 2 + r);
        ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
        ctx.fill();

        // 2. Liquid inside (brighter)
        ctx.fillStyle = "#aa00ff";
        ctx.fillRect(-w / 2 + 2, 0, w - 4, h / 2 - 2);

        // 3. Neck & Cork
        ctx.fillStyle = "#444";
        ctx.fillRect(-w / 4, -h / 2 - 4, w / 2, 4);
        ctx.fillStyle = "#8b4513";
        ctx.fillRect(-w / 6, -h / 2 - 6, w / 3, 2);

        // 4. Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#aa00ff";
      } else {
        ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.restore();
    },
  };
};
