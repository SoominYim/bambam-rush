import { ElementType } from "@/game/types";

export interface ElementStyle {
  color: string;
}

export const ELEMENT_STYLES: Record<string, ElementStyle> = {
  [ElementType.FIRE]: { color: "#ff4400" },
  [ElementType.WATER]: { color: "#0088ff" },
  [ElementType.ICE]: { color: "#00ffff" },
  [ElementType.WIND]: { color: "#00ff88" },
  [ElementType.POISON]: { color: "#aa00ff" },
  [ElementType.ELECTRIC]: { color: "#ffff00" },
  [ElementType.SWORD]: { color: "#cccccc" },
  [ElementType.BOOK]: { color: "#885522" },

  // Advanced / Combined Elements
  [ElementType.INFERNO]: { color: "#ff4400" },
  [ElementType.BLIZZARD]: { color: "#ccffff" },
  [ElementType.POISON_SWAMP]: { color: "#880088" },
  [ElementType.LIGHTNING_CHAIN]: { color: "#ffff00" },
  [ElementType.SWORD_DANCE]: { color: "#ffffff" },
  [ElementType.STEAM]: { color: "#dddddd" },
  [ElementType.LAVA]: { color: "#ff4400" },
  [ElementType.ICEBERG]: { color: "#000088" },
  [ElementType.STORM]: { color: "#ffff00" },
  [ElementType.MELTDOWN]: { color: "#aaffaa" },
  [ElementType.PARALYSIS]: { color: "#aaff00" },
  [ElementType.FREEZE_SHOCK]: { color: "#00ccff" },
  [ElementType.HOLY_SWORD]: { color: "#ffff88" },
  [ElementType.DUAL_SHIELD]: { color: "#4444ff" },

  // Base Types
  [ElementType.PHYSICAL]: { color: "#ffffff" },
  [ElementType.ARCANE]: { color: "#aa00aa" },
  [ElementType.TECH]: { color: "#00ff00" },
  [ElementType.LIGHT]: { color: "#ffffaa" },
  [ElementType.BLOOD]: { color: "#ff0000" },
  [ElementType.GRAVITY]: { color: "#220022" },

  DEFAULT: { color: "#ccc" },
};

export const getElementStyle = (type: string | ElementType): ElementStyle => {
  return ELEMENT_STYLES[type] || ELEMENT_STYLES.DEFAULT;
};
