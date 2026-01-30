import { ElementType } from "@/game/types";
import { RECIPE_LIST } from "@/game/config/recipeData";

// 순서 상관없이 배열 비교 (시너지 확인용)
const areArraysEqualUnordered = (arr1: ElementType[], arr2: ElementType[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, index) => val === sorted2[index]);
};

// 순서까지 정확하게 비교 (3-Match 진화용)
const areArraysEqualOrdered = (arr1: ElementType[], arr2: ElementType[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
};

/**
 * 주어진 재료들이 유효한 조합법인지 확인합니다.
 * 조합에 성공하면 결과물의 타입(ElementType)을 반환하고, 실패하면 null을 반환합니다.
 */
export const findRecipeResult = (inputs: ElementType[]): ElementType | null => {
  // 1. 모든 레시피 순회
  for (const recipe of RECIPE_LIST) {
    // 진화 (Evolution): 같은 아이템 3개
    if (recipe.type === "evolution") {
      if (inputs.length === 3 && areArraysEqualOrdered(inputs, recipe.inputs)) {
        return mapOutputToType(recipe.inputs);
      }
    }

    // 시너지 (Synergy): 서로 다른 아이템 2개
    if (recipe.type === "synergy") {
      if (inputs.length === 2 && areArraysEqualUnordered(inputs, recipe.inputs)) {
        return mapOutputToType(inputs);
      }
    }
  }

  return null;
};

// 재료 목록을 결과물 타입으로 매핑 (하드코딩된 로직)
const mapOutputToType = (inputs: ElementType[]): ElementType | null => {
  const sorted = [...inputs].sort().join(",");

  // 진화 (같은 원소 3개)
  if (sorted === `${ElementType.FIRE},${ElementType.FIRE},${ElementType.FIRE}`) return ElementType.INFERNO;
  if (sorted === `${ElementType.ICE},${ElementType.ICE},${ElementType.ICE}`) return ElementType.BLIZZARD;
  if (sorted === `${ElementType.POISON},${ElementType.POISON},${ElementType.POISON}`) return ElementType.POISON_SWAMP;
  if (sorted === `${ElementType.ELECTRIC},${ElementType.ELECTRIC},${ElementType.ELECTRIC}`)
    return ElementType.LIGHTNING_CHAIN;
  if (sorted === `${ElementType.SWORD},${ElementType.SWORD},${ElementType.SWORD}`) return ElementType.SWORD_DANCE;

  // 시너지 (다른 원소 2개)
  const has = (t1: ElementType, t2: ElementType) => inputs.includes(t1) && inputs.includes(t2);

  if (has(ElementType.FIRE, ElementType.ICE)) return ElementType.STEAM; // 증기 (Vapor)
  if (has(ElementType.FIRE, ElementType.POISON)) return ElementType.LAVA; // 용암
  if (has(ElementType.ICE, ElementType.ELECTRIC)) return ElementType.FREEZE_SHOCK; // 동결 쇼크
  if (has(ElementType.POISON, ElementType.ELECTRIC)) return ElementType.PARALYSIS; // 마비 독
  if (has(ElementType.SWORD, ElementType.BOOK)) return ElementType.HOLY_SWORD; // 신성한 검
  if (has(ElementType.BOOK, ElementType.BOOK)) return ElementType.DUAL_SHIELD; // 이중 방어막

  return null;
};
