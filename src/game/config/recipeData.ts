import { ElementType } from "@/game/types";

export interface Recipe {
  type: "evolution" | "synergy";
  inputs: ElementType[];
  output: string;
  desc: string;
  icon: string;
}

export interface ElementInfo {
  type: ElementType;
  name: string;
  icon: string;
  desc: string;
}

// 1. 원소 정보 통합 (기본 요소 + 파생 요소)
export const ELEMENT_DETAILS: Record<ElementType, ElementInfo> = {
  // 기본 8원소 (Basic Elements)
  [ElementType.FIRE]: { type: ElementType.FIRE, name: "불", icon: "🔥", desc: "기본 공격력 증가" },
  [ElementType.WATER]: { type: ElementType.WATER, name: "물", icon: "💧", desc: "유도탄 발사" },
  [ElementType.ICE]: { type: ElementType.ICE, name: "얼음", icon: "❄️", desc: "적을 느리게 함" },
  [ElementType.WIND]: { type: ElementType.WIND, name: "바람", icon: "💨", desc: "공속 증가 및 관통" },
  [ElementType.POISON]: { type: ElementType.POISON, name: "독", icon: "☠️", desc: "지속 피해 (DoT)" },
  [ElementType.ELECTRIC]: { type: ElementType.ELECTRIC, name: "전기", icon: "⚡", desc: "주변을 도는 오비탈" },
  [ElementType.SWORD]: { type: ElementType.SWORD, name: "검", icon: "🗡️", desc: "강력한 근접 공격" },
  [ElementType.BOOK]: { type: ElementType.BOOK, name: "책", icon: "📖", desc: "스킬 쿨타임 감소" },

  // 진화/시너지 결과물 (Results) - 이모지는 적절히 매칭
  [ElementType.STEAM]: { type: ElementType.STEAM, name: "증기", icon: "☁️", desc: "화상+젖음 시너지" },
  [ElementType.INFERNO]: { type: ElementType.INFERNO, name: "화염폭풍", icon: "☄️", desc: "강력한 화염 마법" },
  [ElementType.LAVA]: { type: ElementType.LAVA, name: "용암", icon: "🌋", desc: "화상+맹독 시너지" },
  [ElementType.ICEBERG]: { type: ElementType.ICEBERG, name: "빙산", icon: "🧊", desc: "거대 얼음 방벽" },
  [ElementType.STORM]: { type: ElementType.STORM, name: "폭풍", icon: "🌪️", desc: "강력한 회오리" },
  [ElementType.BLIZZARD]: { type: ElementType.BLIZZARD, name: "블리자드", icon: "🌨️", desc: "화면 전체 빙결" },

  [ElementType.POISON_SWAMP]: { type: ElementType.POISON_SWAMP, name: "맹독 분수", icon: "🟣", desc: "광범위 독 장판" },
  [ElementType.LIGHTNING_CHAIN]: {
    type: ElementType.LIGHTNING_CHAIN,
    name: "번개 체인",
    icon: "🌩️",
    desc: "연쇄적으로 적 타격",
  },
  [ElementType.SWORD_DANCE]: { type: ElementType.SWORD_DANCE, name: "검무", icon: "⚔️", desc: "12개의 검이 회전" },
  [ElementType.HOLY_SWORD]: { type: ElementType.HOLY_SWORD, name: "신성한 검", icon: "✝️", desc: "관통력과 범위 증가" },
  [ElementType.MELTDOWN]: { type: ElementType.MELTDOWN, name: "융해", icon: "🫠", desc: "방어력 대폭 감소" },
  [ElementType.PARALYSIS]: { type: ElementType.PARALYSIS, name: "마비 독", icon: "🤢", desc: "이동속도 50% 감소" },
  [ElementType.FREEZE_SHOCK]: {
    type: ElementType.FREEZE_SHOCK,
    name: "동결 쇼크",
    icon: "🥶",
    desc: "빙결 상태 적에게 추가딜",
  },
  [ElementType.DUAL_SHIELD]: {
    type: ElementType.DUAL_SHIELD,
    name: "이중 방어막",
    icon: "🛡️",
    desc: "2겹의 보호막 생성",
  },

  // Missing Elements Placeholder
  [ElementType.PHYSICAL]: { type: ElementType.PHYSICAL, name: "물리", icon: "⚔️", desc: "기본 물리 공격" },
  [ElementType.ARCANE]: { type: ElementType.ARCANE, name: "비전", icon: "✨", desc: "마법 공격" },
  [ElementType.TECH]: { type: ElementType.TECH, name: "공학", icon: "⚙️", desc: "기계 장치" },
  [ElementType.LIGHT]: { type: ElementType.LIGHT, name: "빛", icon: "🌟", desc: "신성 속성" },
  [ElementType.BLOOD]: { type: ElementType.BLOOD, name: "혈액", icon: "🩸", desc: "체력 흡수" },
  [ElementType.GRAVITY]: { type: ElementType.GRAVITY, name: "중력", icon: "🌑", desc: "적을 끌어당김" },
};

// 2. 조합법 통합 (Source of Truth from recipes.ts)
export const RECIPE_LIST: Recipe[] = [
  // ⭐ 3-Match 진화 (Upgrade) - 기본 원소 순서대로 정렬
  {
    type: "evolution",
    inputs: [ElementType.FIRE, ElementType.FIRE, ElementType.FIRE],
    output: "화염폭풍 (Inferno)",
    desc: "3방향 화염 방사 + 폭발",
    icon: "☄️",
  },
  {
    type: "evolution",
    inputs: [ElementType.ICE, ElementType.ICE, ElementType.ICE],
    output: "블리자드 (Blizzard)",
    desc: "광역 빙결 마법",
    icon: "🌨️",
  },
  {
    type: "evolution",
    inputs: [ElementType.POISON, ElementType.POISON, ElementType.POISON],
    output: "맹독 분수 (Swamp)",
    desc: "지속적인 독 웅덩이 생성",
    icon: "🟣",
  },
  {
    type: "evolution",
    inputs: [ElementType.ELECTRIC, ElementType.ELECTRIC, ElementType.ELECTRIC],
    output: "번개 체인 (Chain Lightning)",
    desc: "연쇄적인 전기 공격",
    icon: "🌩️",
  },
  {
    type: "evolution",
    inputs: [ElementType.SWORD, ElementType.SWORD, ElementType.SWORD],
    output: "검무 (Sword Dance)",
    desc: "12개의 검이 캐릭터를 호위",
    icon: "⚔️",
  },

  // ✨ 시너지 (Synergies) - 불 먼저, 그 다음 순서대로
  {
    type: "synergy",
    inputs: [ElementType.FIRE, ElementType.ICE],
    output: "증기 폭발 (Vapor)",
    desc: "폭발 범위 2배 증가",
    icon: "☁️",
  },
  {
    type: "synergy",
    inputs: [ElementType.FIRE, ElementType.POISON],
    output: "용암 (Lava)",
    desc: "화상 + 맹독 중첩 효과",
    icon: "🌋",
  },
  {
    type: "synergy",
    inputs: [ElementType.ICE, ElementType.ELECTRIC],
    output: "동결 쇼크 (Freeze Shock)",
    desc: "빙결 상태 적 공격 시 감전 데미지",
    icon: "🥶",
  },
  {
    type: "synergy",
    inputs: [ElementType.POISON, ElementType.ELECTRIC],
    output: "마비 독 (Paralysis)",
    desc: "적 이동속도 -50% 대폭 감소",
    icon: "🤢",
  },
  {
    type: "synergy",
    inputs: [ElementType.SWORD, ElementType.BOOK],
    output: "신성한 검 (Holy Sword)",
    desc: "공격 관통력 + 방어력 증가",
    icon: "✝️",
  },
  {
    type: "synergy",
    inputs: [ElementType.BOOK, ElementType.BOOK],
    output: "이중 방어막 (Dual Shield)",
    desc: "방어막 2겹 생성",
    icon: "🛡️",
  },
];
