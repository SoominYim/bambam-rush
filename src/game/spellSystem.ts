import { GameObject, Vector2D, SpellType } from "./types";
import { createProjectile } from "./entities/projectile";
import { addEntity } from "./gameState";

interface SpellInput {
  type: SpellType;
  timestamp: number;
}

// Queue for stored ammo
let spellQueue: SpellInput[] = [];

export const loadSpell = (type: SpellType) => {
  // Max queue size to prevent infinite stacking
  if (spellQueue.length >= 5) return;

  spellQueue.push({ type, timestamp: Date.now() });
};

export const getSpellQueue = () => spellQueue;

export const spellQueueToString = (): string[] => {
  return spellQueue.map(s => {
    switch (s.type) {
      case SpellType.FIRE:
        return "🔥";
      case SpellType.WATER:
        return "💧";
      case SpellType.ICE:
        return "❄️";
      case SpellType.WIND:
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
    castBasicSpell(origin, target, SpellType.NONE);
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

  if (types2.has(SpellType.FIRE) && types2.has(SpellType.WATER)) {
    consume(2);
    return "STEAM_BLAST";
  }
  if (types2.has(SpellType.FIRE) && types2.has(SpellType.ICE)) {
    consume(2);
    return "MELT";
  }
  if (types2.has(SpellType.FIRE) && types2.has(SpellType.WIND)) {
    consume(2);
    return "FLAME_TORNADO";
  }
  if (types2.has(SpellType.WATER) && types2.has(SpellType.ICE)) {
    consume(2);
    return "FREEZE";
  }
  if (types2.has(SpellType.WATER) && types2.has(SpellType.WIND)) {
    consume(2);
    return "STORM";
  }
  if (types2.has(SpellType.ICE) && types2.has(SpellType.WIND)) {
    consume(2);
    return "BLIZZARD";
  }

  return null;
};

const castBasicSpell = (origin: Vector2D, target: Vector2D, type: SpellType) => {
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  // If type is NONE, projectile implementation usually defaults to white, which is fine for basic attack
  const projectile = createProjectile(origin.x, origin.y, angle, type);
  addEntity(projectile);
};

const castCombo = (origin: Vector2D, target: Vector2D, comboName: string) => {
  console.log(`Combo Activated: ${comboName}`);
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);

  let projType = SpellType.NONE;
  let size = 20;
  let color = "purple";

  switch (comboName) {
    case "STEAM_BLAST":
      projType = SpellType.WATER;
      color = "#ddd";
      size = 25;
      break;
    case "FLAME_TORNADO":
      projType = SpellType.FIRE;
      color = "#f00";
      size = 30;
      break;
    case "STORM":
      projType = SpellType.WIND;
      color = "#ff0";
      size = 25;
      break;
    case "BLIZZARD":
      projType = SpellType.ICE;
      color = "#fff";
      size = 25;
      break;
    case "MELT":
      projType = SpellType.WATER;
      color = "#aaeeee";
      size = 25;
      break;
    case "FREEZE":
      projType = SpellType.ICE;
      color = "#0000ff";
      size = 25;
      break;
    default:
      projType = SpellType.FIRE;
      break;
  }

  const projectile = createProjectile(origin.x, origin.y, angle, projType);
  (projectile as any).radius = size;
  (projectile as any).color = color;
  (projectile as any).damage = 50;

  addEntity(projectile);
};
