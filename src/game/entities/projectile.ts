import { Projectile, Scalar, ElementType, SkillBehavior } from "../types";
import { SPELL_STATS } from "@/game/config/spellStats";
import { updateProjectileBehavior } from "./projectileBehaviors";
import * as CONFIG from "@/game/config/constants";
import { getWeaponIconImage } from "@/game/utils/IconCache";


const PATH_WING_LEFT = "M45 30C35 15 15 10 0 25C10 30 20 30 25 35C30 45 40 40 45 30Z";
const PATH_WING_RIGHT = "M55 30C65 15 85 10 100 25C90 30 80 30 75 35C70 45 60 40 55 30Z";
const PATH_EARS = "M50 20L44 10L46 22L54 22L56 10L50 20Z";

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
    hitTracker: {}, 
    angle: angle,

    update: function (deltaTime: Scalar) {
      
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
      

      
      if ((this as any).behavior) {
        updateProjectileBehavior(this, deltaTime);
      } else {
        
        if (behavior === SkillBehavior.PROJECTILE) {
          this.position.x += Math.cos(this.angle!) * speed * deltaTime;
          this.position.y += Math.sin(this.angle!) * speed * deltaTime;
        } else if (behavior === SkillBehavior.AREA) {
          
          if (Date.now() - this.startTime! > this.duration!) {
            this.isExpired = true;
          }
        }
      }

      
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
        ctx.fillStyle = `${color}33`; 
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if ((this as any).weaponId === "W18") {
        const p = this as any;
        const points = (p.trailPoints || []) as Array<{ x: number; y: number; life: number }>;
        if (points.length > 1) {
          for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const alpha = Math.max(0.05, Math.min(prev.life, curr.life) * 0.6);
            ctx.strokeStyle = `rgba(255, 168, 212, ${alpha})`;
            ctx.lineWidth = 1.8 + i * 0.04;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
          }
        }

        const r = (p.radius || 8) * 0.95;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle || 0);
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ff9ed1";

        ctx.beginPath();
        ctx.moveTo(-r * 0.9, 0);
        ctx.quadraticCurveTo(-r * 0.2, -r * 0.85, r * 0.95, 0);
        ctx.quadraticCurveTo(-r * 0.2, r * 0.85, -r * 0.9, 0);
        ctx.closePath();
        ctx.fillStyle = "#ffd3ea";
        ctx.fill();
        ctx.strokeStyle = "#d46a9c";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-r * 0.7, 0);
        ctx.lineTo(r * 0.55, 0);
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if ((this as any).weaponId === "W19") {
        const p = this as any;
        const r = Math.max(5, (p.radius || 8) * 1.05);
        const a = this.angle || 0;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(a);

        // Phase trail (simple forward streak)
        ctx.strokeStyle = "rgba(173, 116, 255, 0.45)";
        ctx.lineWidth = Math.max(2, r * 0.3);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-r * 2.2, 0);
        ctx.lineTo(-r * 0.2, 0);
        ctx.stroke();

        // Spear body
        ctx.beginPath();
        ctx.moveTo(r * 1.35, 0);
        ctx.lineTo(0, -r * 0.48);
        ctx.lineTo(-r * 1.2, 0);
        ctx.lineTo(0, r * 0.48);
        ctx.closePath();
        ctx.fillStyle = "#d7c6ff";
        ctx.strokeStyle = "#7d5bff";
        ctx.lineWidth = 1.1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#8c6bff";
        ctx.fill();
        ctx.stroke();

        // Core
        ctx.beginPath();
        ctx.arc(r * 0.15, 0, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      } else if (type === ElementType.SWORD) {
        
        const p = this as any;
        if (p.behavior === "ORBIT_STAB") {
          if (p.state === "ORBIT") {
            ctx.restore();
            return;
          }
          
          if (p.state === "RECOVER") {
            const baseRadius = p.orbitRadiusBase || 60;
            const stabRange = p.stabRange || 100;
            const progress = (p.orbitRadiusCurrent - baseRadius) / stabRange; 
            ctx.globalAlpha = Math.max(0, progress);
          }
        }

        
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle || 0);

        
        const r = (this as any).radius || 10;

        
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(0, -r * 0.2, r * 3.0, r * 0.4);

        
        ctx.fillStyle = "#a0a0a0";
        ctx.fillRect(r * 0.2, -r * 0.05, r * 2.5, r * 0.1);

        
        ctx.fillStyle = "#daa520"; 
        ctx.fillRect(-r * 0.2, -r * 0.8, r * 0.4, r * 1.6);

        
        ctx.fillStyle = "#8b4513"; 
        ctx.fillRect(-r * 1.0, -r * 0.2, r * 0.8, r * 0.4);

        
        ctx.fillStyle = "#daa520";
        ctx.fillRect(-r * 1.2, -r * 0.3, r * 0.3, r * 0.6);
        
        ctx.fillStyle = "#daa520";
        ctx.fillRect(-r * 1.2, -r * 0.3, r * 0.3, r * 0.6);
      } else if (type === ElementType.WIND && (this as any).behavior !== "CHAKRAM") {
        
        const rotation = (this as any).visualAngle || this.angle || 0;
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(rotation);

        const r = (this as any).radius || 15;

        
        ctx.beginPath();
        ctx.fillStyle = "#87CEFA"; 
        
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.5, -r * 0.5, r, -r); 
        ctx.quadraticCurveTo(r * 0.2, -r * 0.2, 0, -r * 0.4); 
        
        ctx.quadraticCurveTo(-r * 0.2, -r * 0.2, -r, -r); 
        
        
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.5, -r * 0.2, r, -r * 0.8);
        ctx.quadraticCurveTo(r * 0.2, -r * 0.5, 0, -r * 0.2);
        
        ctx.quadraticCurveTo(-r * 0.5, 0.2, -r, 0.8);
        ctx.quadraticCurveTo(-r * 0.2, 0.5, 0, 0.2);
        ctx.fill();

        
        
        ctx.beginPath();
        ctx.fillStyle = "#E0FFFF"; 
        const width = r * 0.3;
        const length = r;

        ctx.moveTo(width, 0);
        ctx.quadraticCurveTo(width, -length / 2, length, -length); 
        ctx.quadraticCurveTo(0, -width, -width, 0); 
        ctx.quadraticCurveTo(0, width, length, length); 
        ctx.quadraticCurveTo(width, length / 2, width, 0); 
        ctx.fill();

        
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00BFFF";
      } else if (type === ElementType.ICE) {
        
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle || 0);

        
        const size = (this as any).radius || 10;

        ctx.beginPath();
        
        ctx.moveTo(size, 0);
        ctx.lineTo(size * 0.3, size * 0.3);
        ctx.lineTo(0, size); 
        ctx.lineTo(-size * 0.3, size * 0.3);
        ctx.lineTo(-size, 0);
        ctx.lineTo(-size * 0.3, -size * 0.3);
        ctx.lineTo(0, -size); 
        ctx.lineTo(size * 0.3, -size * 0.3);
        ctx.closePath();

        
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.5, "#aaddff");
        g.addColorStop(1, "#0088ff");

        ctx.fillStyle = g;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ffff";
        ctx.fill();

        
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (type === ElementType.POISON && (this as any).behavior === "BOTTLE") {
        
        const p = this as any;
        const visualY = -(p.arcHeight || 0);
        const scale = p.visualScale || 1.0;

        ctx.translate(this.position.x, this.position.y + visualY);
        ctx.scale(scale, scale); 
        ctx.rotate(this.angle || 0);

        const w = 12;
        const h = 16;

        
        ctx.fillStyle = "#6a00b0";
        ctx.beginPath();
        
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

        
        ctx.fillStyle = "#aa00ff";
        ctx.fillRect(-w / 2 + 2, 0, w - 4, h / 2 - 2);

        
        ctx.fillStyle = "#444";
        ctx.fillRect(-w / 4, -h / 2 - 4, w / 2, 4);
        ctx.fillStyle = "#8b4513";
        ctx.fillRect(-w / 6, -h / 2 - 6, w / 3, 2);

        
      } else if (type === ElementType.FIRE) {
        const p = this as any;
        if (p.behavior === "FLAME") {
          
          const baseR = p.radius || 10;
          const scale = p.scale || 1.0;
          const r = baseR * (0.6 + scale * 0.4);
          const alpha = p.alpha !== undefined ? p.alpha : 1.0;

          
          const jitterX = (Math.random() - 0.5) * 4;
          const jitterY = (Math.random() - 0.5) * 4;

          ctx.translate(this.position.x + jitterX, this.position.y + jitterY);

          

          

          
          let color = "";
          if (scale < 1.3) {
            color = `rgba(255, 255, 150, ${alpha})`; 
          } else if (scale < 1.8) {
            color = `rgba(255, 180, 0, ${alpha})`; 
          } else if (scale < 2.5) {
            color = `rgba(255, 80, 0, ${alpha})`; 
          } else {
            color = `rgba(100, 20, 20, ${alpha})`; 
          }

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          
          
          ctx.scale(1 / 1.2, 1 / 0.8);
        } else {
          
          const r = (this as any).radius || 15;
          ctx.translate(this.position.x, this.position.y);

          const g = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
          g.addColorStop(0, "#ffff00");
          g.addColorStop(0.6, "#ff4500");
          g.addColorStop(1, "#8b0000");

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ff4500";
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else if ((this as any).behavior === "BEAM") {
        
        const range = (this as any).range || 1000;
        let width = (this as any).radius || 10;

        
        const duration = (this as any).duration || 300;
        const currentDuration = (this as any).beamDuration !== undefined ? (this as any).beamDuration : duration;

        
        
        const progress = 1 - currentDuration / duration;

        
        const widthFactor = Math.sin(progress * Math.PI);
        width *= 0.2 + widthFactor * 0.8; 

        const startX = this.position.x;
        const startY = this.position.y;
        const angle = this.angle || 0;
        const endX = startX + Math.cos(angle) * range;
        const endY = startY + Math.sin(angle) * range;

        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = width * 0.6;
        ctx.lineCap = "round";
        ctx.stroke();

        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = 0.6;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();

        ctx.shadowBlur = 0; 
        ctx.globalAlpha = 1.0;
      } else if ((this as any).behavior === "BAT") {
        
        const size = ((this as any).radius || 10) * 2.5;
        const waveTime = (this as any).waveTime || 0;

        
        const speed = 5;
        const t = (Math.sin(waveTime * speed) + 1) / 2; 

        const angleL = ((20 * Math.PI) / 180) * t;
        const angleR = ((-20 * Math.PI) / 180) * t;
        const scaleY = 1.0 - t * 0.6;

        
        
        
        const scaleFactor = size / 50;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate((this.angle || 0) + Math.PI / 2);

        
        ctx.scale(scaleFactor, scaleFactor);

        
        ctx.translate(-50, -30);

        
        ctx.fillStyle = "#1a1a1a";

        
        ctx.save();
        ctx.translate(45, 30); 
        ctx.rotate(angleL);
        ctx.scale(1, scaleY);
        ctx.translate(-45, -30);
        ctx.fill(new Path2D(PATH_WING_LEFT));
        ctx.restore();

        
        ctx.save();
        ctx.translate(55, 30); 
        ctx.rotate(angleR);
        ctx.scale(1, scaleY);
        ctx.translate(-55, -30);
        ctx.fill(new Path2D(PATH_WING_RIGHT));
        ctx.restore();

        
        ctx.fill(new Path2D(PATH_EARS));

        
        ctx.beginPath();
        ctx.arc(50, 30, 8, 0, Math.PI * 2);
        ctx.fill();

        
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(47, 28, 2, 0, Math.PI * 2);
        ctx.arc(53, 28, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if ((this as any).behavior === "GRAVITY_ORB") {
        
        const orbRadius = (this as any).radius || 12;
        const now = Date.now();
        const pulse = 1.0 + Math.sin(now / 200) * 0.15; 

        ctx.translate(this.position.x, this.position.y);

        
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius * 2.5 * pulse, 0, Math.PI * 2);
        const outerGrad = ctx.createRadialGradient(0, 0, orbRadius * 0.5, 0, 0, orbRadius * 2.5 * pulse);
        outerGrad.addColorStop(0, "rgba(138, 43, 226, 0.2)");
        outerGrad.addColorStop(0.6, "rgba(75, 0, 130, 0.1)");
        outerGrad.addColorStop(1, "rgba(30, 0, 50, 0)");
        ctx.fillStyle = outerGrad;
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius * pulse, 0, Math.PI * 2);
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbRadius * pulse);
        coreGrad.addColorStop(0, "rgba(0, 0, 0, 0.9)");
        coreGrad.addColorStop(0.6, "rgba(30, 0, 60, 0.8)");
        coreGrad.addColorStop(1, "rgba(90, 0, 150, 0.4)");
        ctx.fillStyle = coreGrad;
        ctx.fill();

        
        ctx.arc(0, 0, orbRadius * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = "#8A2BE2";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#8A2BE2";
        ctx.stroke();
        ctx.shadowBlur = 0;

        
        for (let i = 0; i < 3; i++) {
          const seed = i * 137;
          const pTime = ((now + seed * 80) % 1000) / 1000;
          const pAngle = now / 500 + seed;
          const pDist = orbRadius * (2.0 - pTime * 1.5);
          const px = Math.cos(pAngle) * pDist;
          const py = Math.sin(pAngle) * pDist;
          const pSize = 2 * (1 - pTime);

          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 120, 255, ${0.6 * (1 - pTime)})`;
          ctx.fill();
        }
      } else if ((this as any).behavior === "CHAKRAM") {
        
        const p = this as any;
        const r = p.radius || 16;
        const rot = p.visualAngle || 0;

        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(rot);

        
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        const ringGrad = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
        ringGrad.addColorStop(0, "#C0C0C0");
        ringGrad.addColorStop(0.5, "#E8E8E8");
        ringGrad.addColorStop(1, "#909090");
        ctx.fillStyle = ringGrad;
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2);
        ctx.fillStyle = "#1a1a2e";
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
        ctx.strokeStyle = "#B8860B";
        ctx.lineWidth = r * 0.07;
        ctx.stroke();

        
        ctx.lineWidth = r * 0.13;
        ctx.lineCap = "round";

        
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.bezierCurveTo(r * 0.35, -r * 0.25, r * 0.35, r * 0.25, 0, r * 0.5);
        ctx.stroke();

        
        ctx.beginPath();
        ctx.moveTo(0, r * 0.5);
        ctx.bezierCurveTo(-r * 0.35, r * 0.25, -r * 0.35, -r * 0.25, 0, -r * 0.5);
        ctx.stroke();

        
        ctx.lineWidth = r * 0.04;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.46);
        ctx.bezierCurveTo(r * 0.3, -r * 0.22, r * 0.3, r * 0.22, 0, r * 0.46);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, r * 0.46);
        ctx.bezierCurveTo(-r * 0.3, r * 0.22, -r * 0.3, -r * 0.22, 0, -r * 0.46);
        ctx.stroke();

        
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#E0E0E0";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if ((this as any).behavior === "ARC") {
        
        const p = this as any;
        
        
        

        const size = (p.radius || 10) * 2.5; 
        const visualAngle = p.visualAngle || 0;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(visualAngle);

        
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = "crimson";
        ctx.fill();
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();
      } else {
        const p = this as any;
        const currentRadius = p.radius || radius;

        
        if (p.weaponId === "W12") {
          const weaponId = p.weaponId;
          const img = getWeaponIconImage(weaponId);
          const size = currentRadius * 1.5;

          if (p.rotationSpeed) {
            p.visualAngle = (p.visualAngle || 0) + p.rotationSpeed * 0.009;
          }
          const visualAngle = p.visualAngle || this.angle || 0;

          ctx.save();
          ctx.translate(this.position.x, this.position.y);
          ctx.rotate(visualAngle);

          if (img) {
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          }

          ctx.restore();
        } else if (p.weaponId === "W17") {
          
          const pelletRadius = Math.max(1.8, currentRadius * 0.25);
          const pelletLength = Math.max(pelletRadius * 2.2, (p.pelletLength || currentRadius * 2.4) as number);
          const visualAngle = this.angle || 0;

          ctx.save();
          ctx.translate(this.position.x, this.position.y);
          ctx.rotate(visualAngle);

          const bodyGradient = ctx.createLinearGradient(-pelletLength * 0.5, 0, pelletLength * 0.5, 0);
          bodyGradient.addColorStop(0, "#5a5a5a");
          bodyGradient.addColorStop(0.45, "#c9c9c9");
          bodyGradient.addColorStop(1, "#7a7a7a");

          ctx.fillStyle = bodyGradient;
          ctx.strokeStyle = "#2d2d2d";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-pelletLength * 0.5 + pelletRadius, -pelletRadius);
          ctx.lineTo(pelletLength * 0.5 - pelletRadius, -pelletRadius);
          ctx.arc(pelletLength * 0.5 - pelletRadius, 0, pelletRadius, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(-pelletLength * 0.5 + pelletRadius, pelletRadius);
          ctx.arc(-pelletLength * 0.5 + pelletRadius, 0, pelletRadius, Math.PI / 2, (Math.PI * 3) / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffb66a";
          ctx.beginPath();
          ctx.arc(pelletLength * 0.35, 0, pelletRadius * 0.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(this.position.x, this.position.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      ctx.restore();
    },
  };
};




