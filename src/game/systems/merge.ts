import { getTail } from "@/game/managers/state";
import { ElementType, TailSegment } from "@/game/types";

import { findRecipeResult } from "@/game/systems/recipeSystem";

export const checkTailMerges = () => {
  const tail = getTail();
  if (tail.length < 2) return;

  // 합체 조건 체크 (앞에서부터 순차적으로)
  for (let i = 0; i < tail.length - 1; i++) {
    const s1 = tail[i];
    const s2 = tail[i + 1];

    if (s1.isExpired || s2.isExpired) continue;

    // 1. 3-Match 진화 확인 (아이템 3개 필요)
    if (i < tail.length - 2) {
      const s3 = tail[i + 2];
      if (!s3.isExpired) {
        // 3개 아이템에 대한 조합법 검색
        const result3 = findRecipeResult([s1.type, s2.type, s3.type]);
        if (result3) {
          merge3Segments(s1, s2, s3, result3, 1); // 진화 시 1티어로 초기화
          return;
        }

        // 2. 3-Match 기본 강화 (같은 타입 3개 -> 티어 상승)
        if (s1.type === s2.type && s2.type === s3.type && s1.tier === s2.tier && s2.tier === s3.tier) {
          // Max Tier 3 (Unique)
          if (s1.tier < 3) {
            merge3Segments(s1, s2, s3, s1.type, s1.tier + 1);
            return;
          }
        }
      }
    }

    // 3. 2-Match 시너지 확인
    // 2개 아이템에 대한 조합법 검색
    const result2 = findRecipeResult([s1.type, s2.type]);
    if (result2) {
      mergeSegments(s1, s2, result2, 1);
      return;
    }
  }
};

const mergeSegments = (seg1: TailSegment, seg2: TailSegment, newType: ElementType, newTier: number) => {
  // Upgrade seg1
  seg1.type = newType;
  seg1.tier = newTier;

  // Remove seg2
  seg2.isExpired = true;

  console.log(`✨ Merge! [${newType}] created!`);
};

const merge3Segments = (
  seg1: TailSegment,
  seg2: TailSegment,
  seg3: TailSegment,
  newType: ElementType,
  newTier: number,
) => {
  // Upgrade seg1
  seg1.type = newType;
  seg1.tier = newTier;

  // Remove seg2, seg3
  seg2.isExpired = true;
  seg3.isExpired = true;

  console.log(`🌟 Evolution! [${newType}] created!`);
};
