import { Vector2D, ElementType } from "@/game/types";
import { createProjectile } from "@/game/entities/projectile";
import { addEntity } from "@/game/managers/state";

interface SpellInput {
  type: ElementType;
  timestamp: number;
}

// Queue for stored ammo
let spellQueue: SpellInput[] = [];

export const loadSpell = (type: ElementType) => {
  // Max queue size to prevent infinite stacking
  if (spellQueue.length >= 5) return;

  spellQueue.push({ type, timestamp: Date.now() });
};

export const getSpellQueue = () => spellQueue;

export const spellQueueToString = (): string[] => {
  return spellQueue.map(s => {
    switch (s.type) {
      case ElementType.FIRE:
        return "🔥";
      case ElementType.WATER:
        return "💧";
      case ElementType.ICE:
        return "❄️";
      case ElementType.WIND:
        return "💨";
      default:
        return "❓";
    }
  });
};

export const fireNextSpell = (origin: Vector2D, target: Vector2D) => {
  // Check for combos first
  const combo = checkAndConsumeCombo();

  if (combo) {
    castCombo(origin, target, combo);
  } else if (spellQueue.length > 0) {
    // Fire single spell
    const spell = spellQueue.shift(); // Remove first item
    if (spell) castBasicSpell(origin, target, spell.type);
  } else {
    // Queue empty - Fire basic magic missile
    castBasicSpell(origin, target, ElementType.FIRE);
  }
};

const checkAndConsumeCombo = (): string | null => {
  if (spellQueue.length < 2) return null;

  // Check first 2 items for 2-hit combo
  const first2 = spellQueue.slice(0, 2).map(s => s.type);
  const types2 = new Set(first2);

  // Helper to consume if match
  const consume = (count: number) => {
    spellQueue.splice(0, count);
  };

  if (types2.has(ElementType.FIRE) && types2.has(ElementType.WATER)) {
    consume(2);
    return "STEAM_BLAST";
  }
  if (types2.has(ElementType.FIRE) && types2.has(ElementType.ICE)) {
    consume(2);
    return "MELT";
  }
  if (types2.has(ElementType.FIRE) && types2.has(ElementType.WIND)) {
    consume(2);
    return "FLAME_TORNADO";
  }
  if (types2.has(ElementType.WATER) && types2.has(ElementType.ICE)) {
    consume(2);
    return "FREEZE";
  }
  if (types2.has(ElementType.WATER) && types2.has(ElementType.WIND)) {
    consume(2);
    return "STORM";
  }
  if (types2.has(ElementType.ICE) && types2.has(ElementType.WIND)) {
    consume(2);
    return "BLIZZARD";
  }

  return null;
};

const castBasicSpell = (origin: Vector2D, target: Vector2D, type: ElementType) => {
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  const projectile = createProjectile(origin.x, origin.y, angle, type);
  addEntity(projectile);
};

const castCombo = (origin: Vector2D, target: Vector2D, comboName: string) => {
  console.log(`Combo Activated: ${comboName}`);
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);

  let projType = ElementType.FIRE;
  let size = 20;
  let color = "purple";

  switch (comboName) {
    case "STEAM_BLAST":
      projType = ElementType.WATER;
      color = "#ddd";
      size = 25;
      break;
    case "FLAME_TORNADO":
      projType = ElementType.FIRE;
      color = "#f00";
      size = 30;
      break;
    case "STORM":
      projType = ElementType.WIND;
      color = "#ff0";
      size = 25;
      break;
    case "BLIZZARD":
      projType = ElementType.ICE;
      color = "#fff";
      size = 25;
      break;
    case "MELT":
      projType = ElementType.WATER;
      color = "#aaeeee";
      size = 25;
      break;
    case "FREEZE":
      projType = ElementType.ICE;
      color = "#0000ff";
      size = 25;
      break;
    default:
      projType = ElementType.FIRE;
      break;
  }

  const projectile = createProjectile(origin.x, origin.y, angle, projType);
  (projectile as any).radius = size;
  (projectile as any).color = color;
  (projectile as any).damage = 50;

  addEntity(projectile);
};
