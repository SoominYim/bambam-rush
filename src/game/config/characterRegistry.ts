import { WEAPON_REGISTRY } from "./weaponRegistry";
import { PASSIVE_REGISTRY } from "./passiveRegistry";

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
  startWeaponIds: string[];
  startPassiveIds: string[];
  startLevel?: number; // Starting level for all equipment
  unlocked: boolean;
  unlockCondition?: string;
  visual: CharacterVisuals;
  baseStats?: {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    moveSpeed: number; // Renamed from speed
    fireRate: number;
    projectileSpeed: number;
    duration: number;
    area: number;
    cooldown: number;
    amount: number;
    luck: number;
    revival: number;
    pickupRange: number;
    xp: number;
    maxXp: number;
    level: number;
    gold: number;
  };
}

export const CHARACTER_REGISTRY: Record<string, CharacterDefinition> = {
  TEST: {
    id: "TEST",
    name: "테스트",
    description: "테스트 캐릭터",
    icon: "⚔️",
    startWeaponIds: ["W18"],
    baseStats: {
      hp: 150,
      maxHp: 150,
      atk: 1,
      def: 5,
      moveSpeed: 1.1,
      fireRate: 1.0,
      projectileSpeed: 1.0,
      duration: 1.0,
      area: 1.0,
      cooldown: 0,
      amount: 0,
      luck: 1.0,
      revival: 0,
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 80, // NOTE: game action path comment
      gold: 0,
    },
    startPassiveIds: ["P01"],
    unlocked: true,
    visual: { primary: "#8B9DC3", secondary: "#5C6B8A", eye: "#FFFFFF" },
  },
  BASIC: {
    id: "BASIC",
    name: "전사",
    description: "균형잡힌 기본 캐릭터",
    icon: "⚔️",
    startWeaponIds: ["W01"],
    startPassiveIds: ["P01"],
    unlocked: true,
    visual: { primary: "#8B9DC3", secondary: "#5C6B8A", eye: "#FFFFFF" },
    baseStats: {
      hp: 100,
      maxHp: 100,
      atk: 1.0,
      def: 0,
      moveSpeed: 1.0,
      fireRate: 1.0,
      projectileSpeed: 1.0,
      duration: 1.0,
      area: 1.0,
      cooldown: 0,
      amount: 0,
      luck: 1.0,
      revival: 0,
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 50,
      gold: 0,
    },
  },

  FIRE_MAGE: {
    id: "FIRE_MAGE",
    name: "화염 술사",
    description: "강력한 파괴력을 지닌 화염 마법사",
    icon: "🔥",
    startWeaponIds: ["W03"],
    startPassiveIds: ["P01"],
    unlocked: true,
    visual: { primary: "#FF6B4A", secondary: "#CC4422", eye: "#FFEE00" },
    baseStats: {
      hp: 80,
      maxHp: 80,
      atk: 1.2,
      def: 0,
      moveSpeed: 0.9,
      fireRate: 1.0,
      projectileSpeed: 1.0,
      duration: 1.0,
      area: 1.1, // NOTE: game action path comment
      cooldown: 0,
      amount: 0,
      luck: 1.0,
      revival: 0,
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 50,
      gold: 0,
    },
  },

  FROST_MAGE: {
    id: "FROST_MAGE",
    name: "빙결 술사",
    description: "적을 얼리고 범위 공격에 특화",
    icon: "❄️",
    startWeaponIds: ["W07"],
    startPassiveIds: ["P03"],
    unlocked: true,
    visual: { primary: "#6EC6FF", secondary: "#3498DB", eye: "#FFFFFF" },
    baseStats: {
      hp: 90,
      maxHp: 90,
      atk: 1.0,
      def: 1,
      moveSpeed: 0.9,
      fireRate: 1.0,
      projectileSpeed: 1.0,
      duration: 1.2, // NOTE: game action path comment
      area: 1.1,
      cooldown: 0,
      amount: 0,
      luck: 1.0,
      revival: 0,
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 50,
      gold: 0,
    },
  },

  WIND_RANGER: {
    id: "WIND_RANGER",
    name: "바람 사냥꾼",
    description: "빠른 투사체와 원거리 전투",
    icon: "💨",
    startWeaponIds: ["W06"],
    startPassiveIds: ["P05"],
    unlocked: true,
    visual: { primary: "#7ED321", secondary: "#4A9010", eye: "#FFFFFF" },
    baseStats: {
      hp: 80,
      maxHp: 80,
      atk: 1.1,
      def: 0,
      moveSpeed: 1.2, // 빠른 이동 속도
      fireRate: 1.1, // 빠른 공격 속도
      projectileSpeed: 1.3, // 빠른 투사체
      duration: 1.0,
      area: 1.0,
      cooldown: 0,
      amount: 0,
      luck: 1.0,
      revival: 0,
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 60,
      gold: 0,
    },
  },

  SPEEDSTER: {
    id: "SPEEDSTER",
    name: "스피드스터",
    description: "이동 속도에 특화된 캐릭터",
    icon: "⚡",
    startWeaponIds: ["W04"],
    startPassiveIds: ["P08"],
    unlocked: false,
    unlockCondition: "15분 생존 성공",
    visual: { primary: "#FFD93D", secondary: "#F39C12", eye: "#FFFFFF" },
    baseStats: {
      hp: 70,
      maxHp: 70,
      atk: 0.8,
      def: 0,
      moveSpeed: 1.5, // NOTE: game action path comment
      fireRate: 1.2,
      projectileSpeed: 1.0,
      duration: 1.0,
      area: 1.0,
      cooldown: 0.1, // 荑④컧 10%
      amount: 0,
      luck: 1.0,
      revival: 0,
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 100,
      gold: 0,
    },
  },

  TANK: {
    id: "TANK",
    name: "탱커",
    description: "높은 체력과 방어력을 가진 전사",
    icon: "🛡️",
    startWeaponIds: ["W15"],
    startPassiveIds: ["P04"],
    unlocked: false,
    unlockCondition: "한 게임에서 누적 1000 데미지 받기",
    visual: { primary: "#9B59B6", secondary: "#6C3483", eye: "#FFFFFF" },
    baseStats: {
      hp: 200,
      maxHp: 200,
      atk: 0.8,
      def: 5, // NOTE: game action path comment
      moveSpeed: 0.8, // NOTE: game action path comment
      fireRate: 0.8,
      projectileSpeed: 1.0,
      duration: 1.0,
      area: 1.2, // NOTE: game action path comment
      cooldown: 0,
      amount: 0,
      luck: 1.0,
      revival: 0,
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 50,
      gold: 0,
    },
  },

  ELEMENTALIST: {
    id: "ELEMENTALIST",
    name: "엘리멘탈리스트",
    description: "모든 원소를 다루는 마법의 달인",
    icon: "✨",
    startWeaponIds: ["W02"],
    startPassiveIds: ["P13"],
    unlocked: false,
    unlockCondition: "화염, 얼음, 번개 무기 모두 진화",
    visual: { primary: "#E056FD", secondary: "#9B2CF0", eye: "#00FFFF" },
    baseStats: {
      hp: 100,
      maxHp: 100,
      atk: 1.0,
      def: 0,
      moveSpeed: 1.0,
      fireRate: 1.0,
      projectileSpeed: 1.0,
      duration: 1.1,
      area: 1.1,
      cooldown: 0.05,
      amount: 1, // NOTE: game action path comment
      luck: 1.0,
      revival: 0,
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 50,
      gold: 0,
    },
  },

  GAMBLER: {
    id: "GAMBLER",
    name: "갬블러",
    description: "행운을 믿는 자",
    icon: "🍀",
    startWeaponIds: ["W09"],
    startPassiveIds: ["P10"],
    unlocked: false,
    unlockCondition: "누적 5000 골드 획득",
    visual: { primary: "#1ABC9C", secondary: "#16A085", eye: "#FFD700" },
    baseStats: {
      hp: 100,
      maxHp: 100,
      atk: 1.0,
      def: 0,
      moveSpeed: 1.0,
      fireRate: 1.0,
      projectileSpeed: 1.0,
      duration: 1.0,
      area: 1.0,
      cooldown: 0,
      amount: 0,
      luck: 1.5, // 행운 50% 증가
      revival: 1, // 부활 1회
      xp: 0,
      maxXp: 100,
      level: 1,
      pickupRange: 50,
      gold: 0,
    },
  },
  GOD: {
    id: "GOD",
    name: "수빡이",
    description: "모든 권능을 가진 전설의 개발자 (SECRET)",
    icon: "♾️",
    startWeaponIds: Object.keys(WEAPON_REGISTRY),
    startPassiveIds: Object.keys(PASSIVE_REGISTRY),
    startLevel: 8,
    unlocked: false, // Hidden by default
    visual: { primary: "#FFFFFF", secondary: "#000000", eye: "#64FFDA" },
  },
};

export const getUnlockedCharacters = (): CharacterDefinition[] => {
  return Object.values(CHARACTER_REGISTRY).filter(char => char.unlocked);
};

export const getCharacterById = (id: string): CharacterDefinition | null => {
  return CHARACTER_REGISTRY[id] || null;
};
