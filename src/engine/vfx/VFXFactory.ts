import { vfx } from "./ParticleSystem";
import { ElementType } from "@/game/types";

export const VFXFactory = {
  // ==========================================================================
  // [1] 폭발 효과 (EXPLOSION EFFECTS)
  // ==========================================================================
  createExplosion: (x: number, y: number, type: ElementType, count: number = 20, scale: number = 1.0) => {
    let color = "#ffffff";
    let actualCount = count;

    switch (type) {
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
      case ElementType.POISON:
        color = "#aa00ff";
        break;
      case ElementType.ELECTRIC:
        color = "#ffff00";
        break;
      case ElementType.ARCANE:
        color = "#9c78ff";
        break;
      case ElementType.STEAM:
        color = "#ffffff";
        actualCount *= 1.5;
        break;
      case ElementType.LAVA:
        color = "#ff2200";
        break;
      case ElementType.INFERNO:
        color = "#ff0000";
        actualCount *= 2;
        break;
      case ElementType.BLIZZARD:
        color = "#ffffff";
        actualCount *= 2;
        break;
      case ElementType.POISON_SWAMP:
        color = "#880088";
        break;
      case ElementType.LIGHTNING_CHAIN:
        color = "#ffff00";
        break;
      case ElementType.HOLY_SWORD:
        color = "#ffff88";
        actualCount *= 1.5;
        break;
    }

    if (actualCount <= 10) {
      for (let i = 0; i < actualCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 60;
        vfx.emit({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.2 + Math.random() * 0.2,
          size: (1 + Math.random() * 2) * scale,
          color,
          decay: 0.9,
          glow: true,
        });
      }
      return;
    }

    const isFire = type === ElementType.FIRE;
    for (let i = 0; i < actualCount * 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (15 + Math.random() * 25) * scale;
      vfx.emit({
        x,
        y,
        vx: Math.cos(angle) * speed * 4,
        vy: Math.sin(angle) * speed * 4,
        life: 0.5 + Math.random() * 0.4,
        size: (3 + Math.random() * 5) * scale,
        color: isFire ? (Math.random() > 0.6 ? "#ffcc00" : "#ff4400") : color,
        decay: 0.94,
        alpha: 0.8,
        glow: true,
        drag: 0.92,
        growth: Math.random() * 2,
      });
    }

    if (isFire) {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (5 + Math.random() * 15) * scale;
        vfx.emit({
          x,
          y,
          vx: Math.cos(angle) * speed * 2,
          vy: Math.sin(angle) * speed * 2 - 20,
          life: 0.8 + Math.random() * 0.5,
          size: (1 + Math.random() * 2) * scale,
          color: "#ff8800",
          alpha: 0.6,
          decay: 0.98,
          glow: true,
          gravity: -0.1,
        });
      }
    }
  },

  // ==========================================================================
  // [2] 번개 효과 (LIGHTNING EFFECTS) - 직선 기반 최적화
  // ==========================================================================
  createLightningChain: (startX: number, startY: number, endX: number, endY: number) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 번개 줄기의 꺾임 포인트들 (직선형)
    const generatePoints = () => {
      const points = [{ x: startX, y: startY }];
      const segments = Math.max(3, Math.floor(dist / 30));
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const offset = 25; // 지그재그 편차
        points.push({
          x: startX + dx * t + (Math.random() - 0.5) * offset,
          y: startY + dy * t + (Math.random() - 0.5) * offset,
        });
      }
      points.push({ x: endX, y: endY });
      return points;
    };

    // 1. 메인 굵은 볼트 (발광 포함)
    vfx.emit({
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      life: 0.15,
      color: "#ffffcc",
      glow: true,
      alpha: 1,
      points: generatePoints(),
      width: 4,
    });

    // 2. 중앙 얇은 코어 (매우 밝음)
    vfx.emit({
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      life: 0.1,
      color: "#ffffff",
      glow: false,
      alpha: 1,
      points: generatePoints(),
      width: 1.5,
    });

    // 3. 타격 지점 전기 스파크 (몇 개의 빠른 입자만)
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 150 + Math.random() * 200;
      vfx.emit({
        x: endX,
        y: endY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.1,
        size: 1.5,
        color: "#ffff00",
        decay: 0.8,
        glow: true,
      });
    }
  },

  // Arcane phase link effect for W19 trigger (non-lightning visual).
  createPhaseLinkBurst: (startX: number, startY: number, endX: number, endY: number) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const segments = Math.max(4, Math.floor(dist / 34));

    const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const wobble = 14;
      const ox = (Math.random() - 0.5) * wobble;
      const oy = (Math.random() - 0.5) * wobble;
      points.push({ x: startX + dx * t + ox, y: startY + dy * t + oy });
    }
    points.push({ x: endX, y: endY });

    // Outer phase strand
    vfx.emit({
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      life: 0.16,
      color: "#9b6dff",
      glow: true,
      alpha: 0.9,
      points,
      width: 3.2,
    });

    // Inner bright core
    vfx.emit({
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      life: 0.12,
      color: "#f3eaff",
      glow: true,
      alpha: 1,
      points,
      width: 1.4,
    });

    // Soft destination flare (non-explosive)
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 55;
      vfx.emit({
        x: endX,
        y: endY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.15 + Math.random() * 0.08,
        size: 1.5 + Math.random() * 1.2,
        color: Math.random() > 0.4 ? "#c6a2ff" : "#f3eaff",
        decay: 0.88,
        glow: true,
      });
    }
  },

  // Thunder strike without full-screen flash burst.
  createThunderStrike: (x: number, y: number) => {
    const startY = y - 700;
    VFXFactory.createLightningChain(x + (Math.random() - 0.5) * 50, startY, x, y);
    VFXFactory.createExplosion(x, y, ElementType.ELECTRIC, 10, 1.0);
  },

  // ==========================================================================
  // [3] 잔상 효과 (TRAIL EFFECTS)
  // ==========================================================================
  createTrail: (x: number, y: number, type: ElementType) => {
    let color = "#ffffff";
    let size = 2;
    switch (type) {
      case ElementType.FIRE:
        color = "#ff6600";
        size = 4;
        break;
      case ElementType.WATER:
        color = "#00aaff";
        size = 3;
        break;
      case ElementType.ICE:
        color = "#ccffff";
        size = 2;
        break;
      case ElementType.WIND:
        color = "#ffffff";
        size = 1.5;
        break;
      case ElementType.POISON:
        color = "#ee00ff";
        size = 4;
        break;
      case ElementType.ELECTRIC:
        color = "#ffff88";
        size = 1.5;
        break;
    }

    vfx.emit({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      life: 0.3,
      size,
      color,
      decay: 0.9,
      alpha: 0.4,
    });
  },

  createImpact: (x: number, y: number, type: ElementType) => {
    VFXFactory.createExplosion(x, y, type, 8);
  },
};
