import { vfx } from "./ParticleSystem";
import { ElementType } from "@/game/types";

export const VFXFactory = {
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

    // --- [1] Small Spark/Impact (일반적인 피격이나 적은 개수의 파티클) ---
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
      return; // 일반 피격은 여기서 종료
    }

    // --- [2] Real Weapon Explosion (진짜 폭발 - 많은 개수의 파티클일 때만) ---
    // (기존의 묵직한 화염 로직은 FIRE 타입일 때 더 강조)
    const isFire = type === ElementType.FIRE;

    for (let i = 0; i < actualCount * 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (15 + Math.random() * 25) * scale;
      const isCore = Math.random() > 0.6;

      vfx.emit({
        x,
        y,
        vx: Math.cos(angle) * speed * 4,
        vy: Math.sin(angle) * speed * 4,
        life: 0.5 + Math.random() * 0.4,
        size: (3 + Math.random() * 5) * scale,
        color: isFire ? (isCore ? "#ffcc00" : "#ff4400") : color,
        decay: 0.94,
        alpha: 0.8,
        glow: true,
        drag: 0.92,
        growth: Math.random() * 2,
      });
    }

    // 남는 불씨 (FIRE 일때만)
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
      case ElementType.STEAM:
        color = "#ffffff";
        size = 5;
        break;
      case ElementType.LAVA:
        color = "#ff4400";
        size = 4;
        break;
      case ElementType.INFERNO:
        color = "#ff0000";
        size = 6;
        break;
      case ElementType.HOLY_SWORD:
        color = "#ffffaa";
        size = 3;
        break;
    }

    vfx.emit({
      x,
      y,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50,
      life: 0.3,
      size,
      color,
      decay: 0.9,
      alpha: 0.5,
    });
  },

  createImpact: (x: number, y: number, type: ElementType) => {
    // Smaller explosion for hit
    VFXFactory.createExplosion(x, y, type, 8);
  },
};
