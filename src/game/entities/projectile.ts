import { Projectile, Scalar, ElementType, SkillBehavior } from "../types";
import { SPELL_STATS } from "@/game/config/spellStats";
import { updateProjectileBehavior } from "./projectileBehaviors";
import * as CONFIG from "@/game/config/constants";
import { getWeaponIconImage } from "@/game/utils/IconCache";

// SVG Path Data for Bat
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
      } else if (type === ElementType.WIND && (this as any).behavior !== "CHAKRAM") {
        // --- Boomerang (Wind) Drawing --- (차크람은 별도 렌더링)
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
      } else if (type === ElementType.ICE) {
        // --- Ice Shard / Crystal Drawing ---
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle || 0);

        // 얼음 결정 (십자 + X자 형태)
        const size = (this as any).radius || 10;

        ctx.beginPath();
        // Main Crystal Body (Rhombus/Shard)
        ctx.moveTo(size, 0);
        ctx.lineTo(size * 0.3, size * 0.3);
        ctx.lineTo(0, size); // Tip
        ctx.lineTo(-size * 0.3, size * 0.3);
        ctx.lineTo(-size, 0);
        ctx.lineTo(-size * 0.3, -size * 0.3);
        ctx.lineTo(0, -size); // Top Tip
        ctx.lineTo(size * 0.3, -size * 0.3);
        ctx.closePath();

        // Inner Gradient
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.5, "#aaddff");
        g.addColorStop(1, "#0088ff");

        ctx.fillStyle = g;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ffff";
        ctx.fill();

        // Sharp Outline
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
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
      } else if (type === ElementType.FIRE) {
        const p = this as any;
        if (p.behavior === "FLAME") {
          // --- 화염 방사 입자 (개선된 2D 스타일) ---
          const baseR = p.radius || 10;
          const scale = p.scale || 1.0;
          const r = baseR * (0.6 + scale * 0.4);
          const alpha = p.alpha !== undefined ? p.alpha : 1.0;

          // 지터링: 매 프레임 위치가 살짝 떨림 (일렁임)
          const jitterX = (Math.random() - 0.5) * 4;
          const jitterY = (Math.random() - 0.5) * 4;

          ctx.translate(this.position.x + jitterX, this.position.y + jitterY);

          // 회전: 입자가 회전하며 날아감
          ctx.rotate(this.angle || 0);

          // 모양 변형: 원이 아니라 타원형으로 찌그러뜨림
          ctx.scale(1.2, 0.8);

          // 색상 단계 (채도 올림)
          let color = "";
          if (scale < 1.3) {
            color = `rgba(255, 255, 150, ${alpha})`; // 핵 (연한 노랑)
          } else if (scale < 1.8) {
            color = `rgba(255, 180, 0, ${alpha})`; // 진한 노랑/주황
          } else if (scale < 2.5) {
            color = `rgba(255, 80, 0, ${alpha})`; // 붉은 주황
          } else {
            color = `rgba(100, 20, 20, ${alpha})`; // 검붉음
          }

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // 스케일 복구 (중요: 다음 드로잉에 영향 없게)
          // ctx.restore()가 함수 끝에 있으므로 괜찮지만, 명시적 복구
          ctx.scale(1 / 1.2, 1 / 0.8);
        } else {
          // 일반 화염구 (Fireball 등)
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
        // 레이저 빔 렌더링
        const range = (this as any).range || 1000;
        let width = (this as any).radius || 10;

        // Beam Width Animation (Sine Wave: 0 -> 1 -> 0)
        const duration = (this as any).duration || 300;
        const currentDuration = (this as any).beamDuration !== undefined ? (this as any).beamDuration : duration;

        // progress: 0 (Start) -> 0.5 (Peak) -> 1 (End)
        // beamDuration은 duration -> 0으로 감소하므로:
        const progress = 1 - currentDuration / duration;

        // Sin(0~PI) => 0 -> 1 -> 0
        const widthFactor = Math.sin(progress * Math.PI);
        width *= 0.2 + widthFactor * 0.8; // 최소 20% 두께 보장

        const startX = this.position.x;
        const startY = this.position.y;
        const angle = this.angle || 0;
        const endX = startX + Math.cos(angle) * range;
        const endY = startY + Math.sin(angle) * range;

        // Core Beam
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = width * 0.6;
        ctx.lineCap = "round";
        ctx.stroke();

        // Outer Glow
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = 0.6;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset shadow
        ctx.globalAlpha = 1.0;
      } else if ((this as any).behavior === "BAT") {
        // 박쥐 렌더링 (SVG 기반 Path2D 사용)
        const size = ((this as any).radius || 10) * 2.5;
        const waveTime = (this as any).waveTime || 0;

        // Animation params based on CSS: Slower flap
        const speed = 5;
        const t = (Math.sin(waveTime * speed) + 1) / 2; // 0 ~ 1 oscillation

        const angleL = ((20 * Math.PI) / 180) * t;
        const angleR = ((-20 * Math.PI) / 180) * t;
        const scaleY = 1.0 - t * 0.6;

        // SVG ViewBox 100x60. Center 50,30.
        // We want width approx 'size * 2'.
        // SVG width 100. Scale factor = (size * 2) / 100 = size / 50.
        const scaleFactor = size / 50;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate((this.angle || 0) + Math.PI / 2);

        // Global visual scale
        ctx.scale(scaleFactor, scaleFactor);

        // Align SVG Center(50,30) to (0,0)
        ctx.translate(-50, -30);

        // Body Color #1a1a1a (from SVG)
        ctx.fillStyle = "#1a1a1a";

        // Left Wing
        ctx.save();
        ctx.translate(45, 30); // Origin
        ctx.rotate(angleL);
        ctx.scale(1, scaleY);
        ctx.translate(-45, -30);
        ctx.fill(new Path2D(PATH_WING_LEFT));
        ctx.restore();

        // Right Wing
        ctx.save();
        ctx.translate(55, 30); // Origin
        ctx.rotate(angleR);
        ctx.scale(1, scaleY);
        ctx.translate(-55, -30);
        ctx.fill(new Path2D(PATH_WING_RIGHT));
        ctx.restore();

        // Ears
        ctx.fill(new Path2D(PATH_EARS));

        // Body (Circle)
        ctx.beginPath();
        ctx.arc(50, 30, 8, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (White)
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(47, 28, 2, 0, Math.PI * 2);
        ctx.arc(53, 28, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if ((this as any).behavior === "GRAVITY_ORB") {
        // --- 중력 구체 렌더링 ---
        const orbRadius = (this as any).radius || 12;
        const now = Date.now();
        const pulse = 1.0 + Math.sin(now / 200) * 0.15; // 맥동

        ctx.translate(this.position.x, this.position.y);

        // 1) 외부 왜곡 효과 (보라색 후광)
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius * 2.5 * pulse, 0, Math.PI * 2);
        const outerGrad = ctx.createRadialGradient(0, 0, orbRadius * 0.5, 0, 0, orbRadius * 2.5 * pulse);
        outerGrad.addColorStop(0, "rgba(138, 43, 226, 0.2)");
        outerGrad.addColorStop(0.6, "rgba(75, 0, 130, 0.1)");
        outerGrad.addColorStop(1, "rgba(30, 0, 50, 0)");
        ctx.fillStyle = outerGrad;
        ctx.fill();

        // 2) 코어 (어두운 구체)
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius * pulse, 0, Math.PI * 2);
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, orbRadius * pulse);
        coreGrad.addColorStop(0, "rgba(0, 0, 0, 0.9)");
        coreGrad.addColorStop(0.6, "rgba(30, 0, 60, 0.8)");
        coreGrad.addColorStop(1, "rgba(90, 0, 150, 0.4)");
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // 3) 네온 링
        ctx.beginPath();
        ctx.arc(0, 0, orbRadius * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = "#8A2BE2";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#8A2BE2";
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4) 흡수 파티클 (2~3개)
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
        // --- 차크람 렌더링 (아이콘과 동일) ---
        const p = this as any;
        const r = p.radius || 16;
        const rot = p.visualAngle || 0;

        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(rot);

        // 1) 외부 금속 링 (전체 원)
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        const ringGrad = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
        ringGrad.addColorStop(0, "#C0C0C0");
        ringGrad.addColorStop(0.5, "#E8E8E8");
        ringGrad.addColorStop(1, "#909090");
        ctx.fillStyle = ringGrad;
        ctx.fill();

        // 2) 내부 어두운 원 (링 형태를 만듦)
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.64, 0, Math.PI * 2);
        ctx.fillStyle = "#1a1a2e";
        ctx.fill();

        // 3) 골드 장식 밴드
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
        ctx.strokeStyle = "#B8860B";
        ctx.lineWidth = r * 0.07;
        ctx.stroke();

        // 4) S자 곡선 칼날 2개
        ctx.strokeStyle = "#C0C0C0";
        ctx.lineWidth = r * 0.13;
        ctx.lineCap = "round";

        // 칼날 1
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5);
        ctx.bezierCurveTo(r * 0.35, -r * 0.25, r * 0.35, r * 0.25, 0, r * 0.5);
        ctx.stroke();

        // 칼날 2 (반대편)
        ctx.beginPath();
        ctx.moveTo(0, r * 0.5);
        ctx.bezierCurveTo(-r * 0.35, r * 0.25, -r * 0.35, -r * 0.25, 0, -r * 0.5);
        ctx.stroke();

        // 5) 칼날 하이라이트
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = r * 0.04;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.46);
        ctx.bezierCurveTo(r * 0.3, -r * 0.22, r * 0.3, r * 0.22, 0, r * 0.46);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, r * 0.46);
        ctx.bezierCurveTo(-r * 0.3, r * 0.22, -r * 0.3, -r * 0.22, 0, -r * 0.46);
        ctx.stroke();

        // 6) 외부 엣지
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#E0E0E0";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if ((this as any).behavior === "ARC") {
        // 도끼 투척 (이미지 렌더링)
        const p = this as any;
        // weaponId가 없으면 "W12" 기본값 (안전을 위해)
        // const weaponId = p.weaponId || "W12";
        // const img = getWeaponIconImage(weaponId);

        const size = (p.radius || 10) * 2.5; // 아이콘 크기 조정
        const visualAngle = p.visualAngle || 0;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(visualAngle);

        // 디버깅: 무조건 빨간 원 표시
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

        // 도끼 투사체인 경우 이미지와 회전 적용
        if (p.weaponId === "W12") {
          const weaponId = p.weaponId;
          const img = getWeaponIconImage(weaponId);
          const size = currentRadius * 1.5; // 시각적 크기를 히트박스에 맞춤

          // 회전 업데이트 (느리게)
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
            // Fallback
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          }

          ctx.restore();
        } else {
          // 일반 투사체
          ctx.arc(this.position.x, this.position.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      ctx.restore();
    },
  };
};
