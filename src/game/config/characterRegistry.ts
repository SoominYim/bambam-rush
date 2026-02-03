// import { ElementType } from "@/game/types";

export interface CharacterVisuals {
  primary: string;
  secondary: string;
  eye: string;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  startWeaponId: string;
  startPassiveId: string;
  unlocked: boolean;
  unlockCondition?: string;
  visual: CharacterVisuals;
}

export const CHARACTER_REGISTRY: Record<string, CharacterDefinition> = {
  BASIC: {
    id: "BASIC",
    name: "전사",
    description: "균형잡힌 기본 캐릭터",
    icon: "⚔️",
    startWeaponId: "W01", // 회전 꼬리
    startPassiveId: "P01", // 힘 (Might)
    unlocked: true,
    visual: { primary: "#8B9DC3", secondary: "#5C6B8A", eye: "#FFFFFF" },
  },

  FIRE_MAGE: {
    id: "FIRE_MAGE",
    name: "화염 술사",
    description: "강력한 파괴력을 지닌 화염 마법사",
    icon: "🔥",
    startWeaponId: "W03", // 화염구
    startPassiveId: "P01", // 힘
    unlocked: true,
    visual: { primary: "#FF6B4A", secondary: "#CC4422", eye: "#FFEE00" },
  },

  FROST_MAGE: {
    id: "FROST_MAGE",
    name: "빙결 술사",
    description: "적을 얼리고 범위 공격에 특화",
    icon: "❄️",
    startWeaponId: "W07", // 서리 폭발
    startPassiveId: "P03", // 범위
    unlocked: true,
    visual: { primary: "#6EC6FF", secondary: "#3498DB", eye: "#FFFFFF" },
  },

  WIND_RANGER: {
    id: "WIND_RANGER",
    name: "바람 사냥꾼",
    description: "빠른 투사체와 원거리 전투",
    icon: "💨",
    startWeaponId: "W06", // 부메랑
    startPassiveId: "P05", // 투사체 속도
    unlocked: true,
    visual: { primary: "#7ED321", secondary: "#4A9010", eye: "#FFFFFF" },
  },

  SPEEDSTER: {
    id: "SPEEDSTER",
    name: "스피드스터",
    description: "이동 속도에 특화된 캐릭터",
    icon: "⚡",
    startWeaponId: "W04", // 체인 라이트닝
    startPassiveId: "P08", // 이동 속도
    unlocked: false,
    unlockCondition: "15분 생존 성공",
    visual: { primary: "#FFD93D", secondary: "#F39C12", eye: "#FFFFFF" },
  },

  TANK: {
    id: "TANK",
    name: "탱커",
    description: "높은 체력과 방어력을 가진 전사",
    icon: "🛡️",
    startWeaponId: "W15", // 화염 오라
    startPassiveId: "P04", // 최대 체력
    unlocked: false,
    unlockCondition: "한 게임에서 누적 1000 데미지 받기",
    visual: { primary: "#9B59B6", secondary: "#6C3483", eye: "#FFFFFF" },
  },

  ELEMENTALIST: {
    id: "ELEMENTALIST",
    name: "엘리멘탈리스트",
    description: "모든 원소를 다루는 마법의 달인",
    icon: "✨",
    startWeaponId: "W02", // 매직 미사일
    startPassiveId: "P13", // 복제
    unlocked: false,
    unlockCondition: "화염, 얼음, 전기 무기 모두 진화",
    visual: { primary: "#E056FD", secondary: "#9B2CF0", eye: "#00FFFF" },
  },

  GAMBLER: {
    id: "GAMBLER",
    name: "갬블러",
    description: "행운을 믿는 자",
    icon: "🍀",
    startWeaponId: "W09", // 바늘 지뢰
    startPassiveId: "P10", // 행운
    unlocked: false,
    unlockCondition: "누적 5000 골드 획득",
    visual: { primary: "#1ABC9C", secondary: "#16A085", eye: "#FFD700" },
  },
};

export const getUnlockedCharacters = (): CharacterDefinition[] => {
  return Object.values(CHARACTER_REGISTRY).filter(char => char.unlocked);
};

export const getCharacterById = (id: string): CharacterDefinition | null => {
  return CHARACTER_REGISTRY[id] || null;
};
