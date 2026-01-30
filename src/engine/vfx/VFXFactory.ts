import { vfx } from "./ParticleSystem";
import { ElementType } from "@/game/types";

export const VFXFactory = {
  createExplosion: (x: number, y: number, type: ElementType, count: number = 20) => {
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

    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      vfx.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color,
        decay: 0.95,
        glow: true,
      });
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
