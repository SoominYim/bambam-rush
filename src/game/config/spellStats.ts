import { ElementType, SkillBehavior } from "@/game/types";

export interface SpellStat {
  damage: number;
  speed: number;
  size: number;
  color: string;
  behavior: SkillBehavior;
  fireRateMult?: number; // 기본 공속에 곱해질 가중치 (기본 1.0)
  penetration?: number;
  duration?: number;
}

export const SPELL_STATS: Record<ElementType, SpellStat> = {
  // 1. 기본 원소
  [ElementType.FIRE]: { behavior: SkillBehavior.PROJECTILE, damage: 10, speed: 600, size: 10, color: "#ff4400" },
  [ElementType.WATER]: { behavior: SkillBehavior.PROJECTILE, damage: 8, speed: 500, size: 8, color: "#0088ff" },
  [ElementType.ICE]: { behavior: SkillBehavior.PROJECTILE, damage: 5, speed: 450, size: 8, color: "#00ffff" },
  [ElementType.WIND]: {
    behavior: SkillBehavior.PROJECTILE,
    damage: 7,
    speed: 800,
    size: 7,
    color: "#ccffcc",
    penetration: 1,
  },
  [ElementType.POISON]: {
    behavior: SkillBehavior.PROJECTILE,
    damage: 3,
    speed: 400,
    size: 7,
    color: "#aa00ff",
    duration: 3000,
  },
  [ElementType.ELECTRIC]: { behavior: SkillBehavior.ORBITAL, damage: 6, speed: 400, size: 12, color: "#ffdd00" },
  [ElementType.SWORD]: { behavior: SkillBehavior.MELEE, damage: 15, speed: 0, size: 40, color: "#cccccc" },
  [ElementType.BOOK]: { behavior: SkillBehavior.PROJECTILE, damage: 0, speed: 0, size: 0, color: "#885522" },

  // [NEW] 누락된 타입 추가
  [ElementType.PHYSICAL]: { behavior: SkillBehavior.PROJECTILE, damage: 10, speed: 200, size: 10, color: "#ffffff" },
  [ElementType.ARCANE]: { behavior: SkillBehavior.PROJECTILE, damage: 20, speed: 300, size: 12, color: "#aa00aa" },
  [ElementType.TECH]: { behavior: SkillBehavior.PROJECTILE, damage: 12, speed: 400, size: 8, color: "#00ff00" },
  [ElementType.LIGHT]: { behavior: SkillBehavior.ORBITAL, damage: 18, speed: 200, size: 15, color: "#ffffaa" },
  [ElementType.BLOOD]: { behavior: SkillBehavior.PROJECTILE, damage: 15, speed: 250, size: 10, color: "#ff0000" },
  [ElementType.GRAVITY]: { behavior: SkillBehavior.AREA, damage: 20, speed: 0, size: 50, color: "#220022" },

  // 2. 진화 (3-Match)
  [ElementType.INFERNO]: {
    behavior: SkillBehavior.PROJECTILE,
    damage: 25,
    speed: 600,
    size: 25,
    color: "#ff0044",
    penetration: 99,
  },
  [ElementType.BLIZZARD]: {
    behavior: SkillBehavior.AREA,
    damage: 10,
    speed: 0,
    size: 300,
    color: "#ccffff",
    duration: 5000,
  },
  [ElementType.POISON_SWAMP]: {
    behavior: SkillBehavior.AREA,
    damage: 5,
    speed: 0,
    size: 150,
    color: "#880088",
    duration: 8000,
  },
  [ElementType.LIGHTNING_CHAIN]: {
    behavior: SkillBehavior.PROJECTILE,
    damage: 15,
    speed: 1000,
    size: 10,
    color: "#ffff00",
    penetration: 5,
  },
  [ElementType.SWORD_DANCE]: { behavior: SkillBehavior.ORBITAL, damage: 30, speed: 600, size: 30, color: "#ffffff" },

  // 3. 시너지 (Combos)
  [ElementType.STEAM]: {
    behavior: SkillBehavior.PROJECTILE,
    damage: 12,
    speed: 500,
    size: 70,
    color: "#dddddd",
    penetration: 2,
  },
  [ElementType.LAVA]: {
    behavior: SkillBehavior.AREA,
    damage: 15,
    speed: 300,
    size: 20,
    color: "#ff4400",
    duration: 4000,
  },
  [ElementType.ICEBERG]: {
    behavior: SkillBehavior.AREA,
    damage: 30,
    speed: 200,
    size: 40,
    color: "#000088",
    penetration: 10,
  },
  [ElementType.STORM]: {
    behavior: SkillBehavior.AREA,
    damage: 10,
    speed: 600,
    size: 50,
    color: "#ffff00",
    penetration: 99,
  },
  [ElementType.MELTDOWN]: {
    behavior: SkillBehavior.AREA,
    damage: 20,
    speed: 0,
    size: 100,
    color: "#aaffaa",
    duration: 2000,
  },
  [ElementType.PARALYSIS]: { behavior: SkillBehavior.PROJECTILE, damage: 5, speed: 500, size: 10, color: "#aaff00" },
  [ElementType.FREEZE_SHOCK]: {
    behavior: SkillBehavior.PROJECTILE,
    damage: 20,
    speed: 700,
    size: 15,
    color: "#00ccff",
  },
  [ElementType.HOLY_SWORD]: {
    behavior: SkillBehavior.MELEE,
    damage: 40,
    speed: 0,
    size: 80,
    color: "#ffff88",
    penetration: 5,
  },
  [ElementType.DUAL_SHIELD]: { behavior: SkillBehavior.ORBITAL, damage: 0, speed: 200, size: 50, color: "#4444ff" },
};
