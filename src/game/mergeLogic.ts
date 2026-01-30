import { getTail } from "./gameState";
import { ElementType, TailSegment } from "./types";

// Recipe Table
const recipes: Record<string, ElementType> = {
  // Fire combos
  [`${ElementType.FIRE}-${ElementType.WATER}`]: ElementType.STEAM,
  [`${ElementType.WATER}-${ElementType.FIRE}`]: ElementType.STEAM,

  [`${ElementType.FIRE}-${ElementType.WIND}`]: ElementType.INFERNO,
  [`${ElementType.WIND}-${ElementType.FIRE}`]: ElementType.INFERNO,

  // Water combos
  [`${ElementType.WATER}-${ElementType.ICE}`]: ElementType.ICEBERG,
  [`${ElementType.ICE}-${ElementType.WATER}`]: ElementType.ICEBERG,

  [`${ElementType.WATER}-${ElementType.WIND}`]: ElementType.STORM,
  [`${ElementType.WIND}-${ElementType.WATER}`]: ElementType.STORM,

  // Ice combos
  [`${ElementType.ICE}-${ElementType.WIND}`]: ElementType.BLIZZARD,
  [`${ElementType.WIND}-${ElementType.ICE}`]: ElementType.BLIZZARD,

  // Special: Fire + Ice -> Lava (Thermal Shock?)
  [`${ElementType.FIRE}-${ElementType.ICE}`]: ElementType.LAVA,
  [`${ElementType.ICE}-${ElementType.FIRE}`]: ElementType.LAVA,
};

export const checkTailMerges = () => {
  const tail = getTail();
  if (tail.length < 2) return;

  for (let i = 0; i < tail.length - 1; i++) {
    const current = tail[i];
    const next = tail[i + 1];

    if (current.isExpired || next.isExpired) continue;

    // 1. Check Same Type Merge (Tier Upgrade) - Classic Suika
    if (current.type === next.type && current.tier === next.tier) {
      mergeSegments(current, next, current.type, current.tier + 1);
      return; // Only one merge per frame to avoid chaos
    }

    // 2. Check Recipe Merge (Alchemy) - New Feature
    // Only merge if both are Tier 1 (Base elements) to keep it simple for now?
    // Or allow high tier merges? Let's stick to Tier 1 for base recipes.
    if (current.tier === 1 && next.tier === 1) {
      const key = `${current.type}-${next.type}`;
      const resultType = recipes[key];

      if (resultType) {
        mergeSegments(current, next, resultType, 2); // Combos start at Tier 2 power
        return;
      }
    }
  }
};

const mergeSegments = (seg1: TailSegment, seg2: TailSegment, newType: ElementType, newTier: number) => {
  // Upgrade seg1
  seg1.type = newType;
  seg1.tier = newTier;

  // Remove seg2
  seg2.isExpired = true;

  // Re-link chain
  const tail = getTail();
  const afterSeg2 = tail.find(t => t.followTarget === seg2);
  if (afterSeg2) {
    afterSeg2.followTarget = seg1;
  }

  console.log(`Alchemy! Merged into ${newType} (Tier ${newTier})`);
};
