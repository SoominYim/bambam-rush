import { ElementType } from "@/game/types";

// 무기 레벨별 스케일링 정의
export interface WeaponLevelScale {
  damage?: number;
  cooldown?: number;
  count?: number;
  size?: number;
  area?: number;
  speed?: number;
  duration?: number;
  pierce?: number;
  range?: number;
  hitInterval?: number; // Added hitInterval
  description?: string;
}

// 무기 정의
export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  pattern:
    | "orbit"
    | "projectile"
    | "line"
    | "chain"
    | "area"
    | "return"
    | "nova"
    | "trap"
    | "beam"
    | "minion"
    | "arc"
    | "vortex"
    | "bounce"
    | "aura"
    | "sky"
    | "spread"
    | "gas"
    | "linear"
    | "swing"
    | "stab"
    | "nuke";
  tags: ElementType[];
  baseStats: {
    damage: number;
    cooldown: number;
    count: number;
    size: number;
    speed?: number;
    duration?: number;
    pierce?: number;
    range?: number;
    hitInterval?: number; // Added hitInterval
  };
  levels: Record<number, WeaponLevelScale>;
  evolution?: {
    requiredPassive: string;
    evolvedId: string;
    evolvedName: string;
  };
}

// 20가지 무기 전체 구현
export const WEAPON_REGISTRY: Record<string, WeaponDefinition> = {
  W01: {
    id: "W01",
    name: "기본 검",
    description: "꼬리 주변을 수호하는 회전 검",
    pattern: "orbit",
    tags: [ElementType.SWORD],
    baseStats: {
      damage: 15,
      cooldown: 0, // 지속형이므로 쿨타임 의미 없음 (업데이트 주기용)
      count: 1,
      size: 8,
      speed: 0.8, // Orbit Speed
      duration: 0,
      range: 50, // Stab Range
      hitInterval: 200, // 200ms (Standard Sweet Spot)
    },
    levels: {
      2: { damage: 5, description: "데미지 +5" },
      3: { size: 2, range: 10, description: "크기/범위 증가" },
      4: { speed: 0.2, description: "회전 속도 증가" },
      5: { damage: 10, description: "데미지 +10" },
      6: { count: 1, description: "검 +1" },
      7: { damage: 15, description: "데미지 +15" },
      8: { damage: 20, size: 5, range: 20, description: "MAX: 강력한 성장" },
    },
    evolution: {
      requiredPassive: "P01",
      evolvedId: "W01_EVO",
      evolvedName: "⚔️ 엑스칼리버",
    },
  },

  W02: {
    id: "W02",
    name: "매직 미사일",
    description: "가장 가까운 적을 추적하는 미사일",
    pattern: "projectile",
    tags: [ElementType.ARCANE],
    baseStats: { damage: 20, cooldown: 2000, count: 1, size: 15, speed: 250, pierce: 1 },
    levels: {
      2: { damage: 5, description: "데미지 +5" },
      3: { cooldown: -200, description: "쿨타임 -0.2초" },
      4: { count: 1, description: "미사일 +1" },
      5: { damage: 8, description: "데미지 +8" },
      6: { count: 1, description: "미사일 +1" },
      7: { damage: 10, cooldown: -200, description: "데미지 +10, 쿨타임 -0.2초" },
      8: { count: 2, damage: 15, description: "MAX: 미사일 +2, 데미지 +15" },
    },
    evolution: {
      requiredPassive: "P13",
      evolvedId: "W02_EVO",
      evolvedName: "🎆 비전 탄막",
    },
  },

  W03: {
    id: "W03",
    name: "화염구",
    description: "전방으로 직선 발사되는 고화력 탄환",
    pattern: "line",
    tags: [ElementType.FIRE],
    baseStats: { damage: 35, cooldown: 1500, count: 1, size: 20, speed: 300, pierce: 2 },
    levels: {
      2: { damage: 8, description: "데미지 +8" },
      3: { pierce: 1, description: "관통 +1" },
      4: { damage: 12, description: "데미지 +12" },
      5: { count: 1, description: "화염구 +1" },
      6: { damage: 15, pierce: 2, description: "데미지 +15, 관통 +2" },
      7: { damage: 20, description: "데미지 +20" },
      8: { damage: 30, size: 15, description: "MAX: 데미지 +30, 크기 +15" },
    },
    evolution: {
      requiredPassive: "P01",
      evolvedId: "W03_EVO",
      evolvedName: "☄️ 헬파이어",
    },
  },

  W04: {
    id: "W04",
    name: "체인 라이트닝",
    description: "적들 사이를 튕기며 전이되는 번개",
    pattern: "chain",
    tags: [ElementType.ELECTRIC],
    baseStats: { damage: 25, cooldown: 3000, count: 1, size: 10, speed: 400, pierce: 3 },
    levels: {
      2: { damage: 6, description: "데미지 +6" },
      3: { pierce: 1, description: "체인 +1" },
      4: { cooldown: -300, description: "쿨타임 -0.3초" },
      5: { damage: 10, pierce: 2, description: "데미지 +10, 체인 +2" },
      6: { cooldown: -400, description: "쿨타임 -0.4초" },
      7: { damage: 15, pierce: 2, description: "데미지 +15, 체인 +2" },
      8: { damage: 25, pierce: 5, description: "MAX: 데미지 +25, 체인 +5" },
    },
    evolution: {
      requiredPassive: "P02",
      evolvedId: "W04_EVO",
      evolvedName: "⚡ 폭풍 네트워크",
    },
  },

  W05: {
    id: "W05",
    name: "맹독 웅덩이",
    description: "바닥에 지속 피해를 주는 독 장판 생성",
    pattern: "area",
    tags: [ElementType.POISON],
    baseStats: { damage: 15, cooldown: 4000, count: 1, size: 80, duration: 3000 },
    levels: {
      2: { damage: 4, description: "데미지 +4" },
      3: { duration: 500, description: "지속시간 +0.5초" },
      4: { size: 20, description: "범위 +20" },
      5: { count: 1, description: "웅덩이 +1" },
      6: { damage: 8, duration: 1000, description: "데미지 +8, 지속시간 +1초" },
      7: { size: 30, description: "범위 +30" },
      8: { damage: 15, count: 2, description: "MAX: 데미지 +15, 웅덩이 +2" },
    },
    evolution: {
      requiredPassive: "P06",
      evolvedId: "W05_EVO",
      evolvedName: "☠️ 베놈 스웜프",
    },
  },

  W06: {
    id: "W06",
    name: "부메랑",
    description: "던지면 돌아오며 두 번 타격",
    pattern: "return",
    tags: [ElementType.WIND],
    baseStats: { damage: 30, cooldown: 2500, count: 1, size: 18, speed: 200 },
    levels: {
      2: { damage: 7, description: "데미지 +7" },
      3: { count: 1, description: "부메랑 +1" },
      4: { speed: 30, description: "속도 +30" },
      5: { damage: 12, description: "데미지 +12" },
      6: { count: 1, description: "부메랑 +1" },
      7: { damage: 15, speed: 50, description: "데미지 +15, 속도 +50" },
      8: { damage: 25, count: 2, description: "MAX: 데미지 +25, 부메랑 +2" },
    },
    evolution: {
      requiredPassive: "P05",
      evolvedId: "W06_EVO",
      evolvedName: "🌀 스톰 룰러",
    },
  },

  W07: {
    id: "W07",
    name: "서리 폭발",
    description: "플레이어 주변 폭발, 적 빙결",
    pattern: "nova",
    tags: [ElementType.ICE],
    baseStats: { damage: 40, cooldown: 5000, count: 1, size: 120, duration: 1000 },
    levels: {
      2: { damage: 10, description: "데미지 +10" },
      3: { size: 20, description: "범위 +20" },
      4: { cooldown: -500, description: "쿨타임 -0.5초" },
      5: { damage: 15, description: "데미지 +15" },
      6: { size: 40, description: "범위 +40" },
      7: { cooldown: -700, description: "쿨타임 -0.7초" },
      8: { damage: 30, size: 60, description: "MAX: 데미지 +30, 범위 +60" },
    },
    evolution: {
      requiredPassive: "P03",
      evolvedId: "W07_EVO",
      evolvedName: "❄️ 절대 영도",
    },
  },

  W08: {
    id: "W08",
    name: "수호의 구슬",
    description: "투사체를 막고 적에게 피해를 줌",
    pattern: "orbit",
    tags: [ElementType.LIGHT],
    baseStats: { damage: 18, cooldown: 0, count: 2, size: 25, speed: 2.5 },
    levels: {
      2: { damage: 4, description: "데미지 +4" },
      3: { count: 1, description: "구슬 +1" },
      4: { damage: 6, description: "데미지 +6" },
      5: { size: 8, description: "크기 +8" },
      6: { count: 1, description: "구슬 +1" },
      7: { damage: 10, description: "데미지 +10" },
      8: { count: 2, damage: 15, description: "MAX: 구슬 +2, 데미지 +15" },
    },
  },

  W09: {
    id: "W09",
    name: "바늘 지뢰",
    description: "밟으면 폭발하는 지뢰 설치",
    pattern: "trap",
    tags: [ElementType.PHYSICAL],
    baseStats: { damage: 50, cooldown: 3000, count: 1, size: 60, duration: 8000 },
    levels: {
      2: { damage: 12, description: "데미지 +12" },
      3: { count: 1, description: "지뢰 +1" },
      4: { damage: 18, description: "데미지 +18" },
      5: { size: 15, description: "폭발 범위 +15" },
      6: { count: 1, description: "지뢰 +1" },
      7: { damage: 25, description: "데미지 +25" },
      8: { damage: 40, count: 2, description: "MAX: 데미지 +40, 지뢰 +2" },
    },
  },

  W10: {
    id: "W10",
    name: "레이저 빔",
    description: "관통하는 지속 레이저 발사",
    pattern: "beam",
    tags: [ElementType.TECH],
    baseStats: { damage: 8, cooldown: 100, count: 1, size: 10, duration: 2000, pierce: 999 },
    levels: {
      2: { damage: 2, description: "데미지 +2" },
      3: { duration: 500, description: "지속시간 +0.5초" },
      4: { damage: 3, description: "데미지 +3" },
      5: { size: 3, description: "폭 +3" },
      6: { duration: 700, description: "지속시간 +0.7초" },
      7: { damage: 5, description: "데미지 +5" },
      8: { damage: 10, duration: 1000, description: "MAX: 데미지 +10, 지속 +1초" },
    },
    evolution: {
      requiredPassive: "P07",
      evolvedId: "W10_EVO",
      evolvedName: "🔦 데스 레이",
    },
  },

  W11: {
    id: "W11",
    name: "박쥐 소환",
    description: "적을 공격하는 박쥐 소환",
    pattern: "minion",
    tags: [ElementType.BLOOD],
    baseStats: { damage: 12, cooldown: 1000, count: 3, size: 12, speed: 150 },
    levels: {
      2: { count: 1, description: "박쥐 +1" },
      3: { damage: 3, description: "데미지 +3" },
      4: { count: 2, description: "박쥐 +2" },
      5: { damage: 5, description: "데미지 +5" },
      6: { count: 2, description: "박쥐 +2" },
      7: { damage: 8, description: "데미지 +8" },
      8: { count: 5, damage: 12, description: "MAX: 박쥐 +5, 데미지 +12" },
    },
    evolution: {
      requiredPassive: "P04",
      evolvedId: "W11_EVO",
      evolvedName: "🧛 뱀파이어 로드",
    },
  },

  W12: {
    id: "W12",
    name: "도끼 투척",
    description: "높은 곡사로 던져 범위 피해",
    pattern: "arc",
    tags: [ElementType.PHYSICAL],
    baseStats: { damage: 45, cooldown: 3500, count: 1, size: 70, speed: 180 },
    levels: {
      2: { damage: 10, description: "데미지 +10" },
      3: { size: 15, description: "범위 +15" },
      4: { damage: 15, description: "데미지 +15" },
      5: { count: 1, description: "도끼 +1" },
      6: { damage: 20, description: "데미지 +20" },
      7: { size: 25, description: "범위 +25" },
      8: { damage: 35, count: 1, description: "MAX: 데미지 +35, 도끼 +1" },
    },
  },

  W13: {
    id: "W13",
    name: "블랙홀",
    description: "적들을 중심으로 끌어당김",
    pattern: "vortex",
    tags: [ElementType.GRAVITY],
    baseStats: { damage: 10, cooldown: 8000, count: 1, size: 150, duration: 3000 },
    levels: {
      2: { damage: 3, description: "데미지 +3" },
      3: { duration: 500, description: "지속시간 +0.5초" },
      4: { size: 30, description: "범위 +30" },
      5: { damage: 6, description: "데미지 +6" },
      6: { duration: 1000, description: "지속시간 +1초" },
      7: { size: 50, description: "범위 +50" },
      8: { damage: 15, size: 80, description: "MAX: 데미지 +15, 범위 +80" },
    },
    evolution: {
      requiredPassive: "P09",
      evolvedId: "W13_EVO",
      evolvedName: "⚫ 이벤트 호라이즌",
    },
  },

  W14: {
    id: "W14",
    name: "차크람",
    description: "벽과 화면 끝에서 튕기는 칼날",
    pattern: "bounce",
    tags: [ElementType.WIND],
    baseStats: { damage: 22, cooldown: 1800, count: 2, size: 16, speed: 280, pierce: 5 },
    levels: {
      2: { damage: 5, description: "데미지 +5" },
      3: { count: 1, description: "차크람 +1" },
      4: { pierce: 2, description: "튕김 +2" },
      5: { damage: 8, description: "데미지 +8" },
      6: { count: 1, description: "차크람 +1" },
      7: { damage: 12, pierce: 3, description: "데미지 +12, 튕김 +3" },
      8: { damage: 18, count: 2, description: "MAX: 데미지 +18, 차크람 +2" },
    },
  },

  W15: {
    id: "W15",
    name: "화염 오라",
    description: "플레이어 주변에 지속 화염 피해",
    pattern: "aura",
    tags: [ElementType.FIRE],
    baseStats: { damage: 10, cooldown: 500, count: 1, size: 80, duration: 99999 },
    levels: {
      2: { damage: 3, description: "데미지 +3" },
      3: { size: 15, description: "범위 +15" },
      4: { damage: 5, description: "데미지 +5" },
      5: { size: 20, description: "범위 +20" },
      6: { damage: 8, description: "데미지 +8" },
      7: { size: 30, description: "범위 +30" },
      8: { damage: 15, size: 40, description: "MAX: 데미지 +15, 범위 +40" },
    },
  },

  W16: {
    id: "W16",
    name: "천둥 번개",
    description: "하늘에서 랜덤하게 떨어지는 벼락",
    pattern: "sky",
    tags: [ElementType.ELECTRIC],
    baseStats: { damage: 60, cooldown: 4000, count: 1, size: 50, duration: 500 },
    levels: {
      2: { damage: 15, description: "데미지 +15" },
      3: { count: 1, description: "벼락 +1" },
      4: { damage: 20, description: "데미지 +20" },
      5: { cooldown: -500, description: "쿨타임 -0.5초" },
      6: { count: 1, description: "벼락 +1" },
      7: { damage: 30, description: "데미지 +30" },
      8: { damage: 50, count: 2, description: "MAX: 데미지 +50, 벼락 +2" },
    },
  },

  W17: {
    id: "W17",
    name: "샷건",
    description: "부채꼴 범위로 탄환 발사",
    pattern: "spread",
    tags: [ElementType.TECH],
    baseStats: { damage: 12, cooldown: 1200, count: 5, size: 12, speed: 320, pierce: 1 },
    levels: {
      2: { damage: 3, description: "데미지 +3" },
      3: { count: 2, description: "탄환 +2" },
      4: { damage: 5, description: "데미지 +5" },
      5: { pierce: 1, description: "관통 +1" },
      6: { count: 3, description: "탄환 +3" },
      7: { damage: 8, description: "데미지 +8" },
      8: { damage: 15, count: 5, description: "MAX: 데미지 +15, 탄환 +5" },
    },
  },

  W18: {
    id: "W18",
    name: "역병 구름",
    description: "움직이는 독구름 생성",
    pattern: "gas",
    tags: [ElementType.POISON],
    baseStats: { damage: 8, cooldown: 3000, count: 1, size: 100, duration: 5000, speed: 50 },
    levels: {
      2: { damage: 2, description: "데미지 +2" },
      3: { size: 20, description: "범위 +20" },
      4: { duration: 1000, description: "지속시간 +1초" },
      5: { damage: 4, description: "데미지 +4" },
      6: { count: 1, description: "구름 +1" },
      7: { size: 30, description: "범위 +30" },
      8: { damage: 10, count: 1, description: "MAX: 데미지 +10, 구름 +1" },
    },
  },

  W19: {
    id: "W19",
    name: "얼음 파편",
    description: "적을 느리게 하는 빠른 투사체",
    pattern: "linear",
    tags: [ElementType.ICE],
    baseStats: { damage: 18, cooldown: 1000, count: 3, size: 14, speed: 400, pierce: 2 },
    levels: {
      2: { damage: 4, description: "데미지 +4" },
      3: { count: 1, description: "파편 +1" },
      4: { pierce: 1, description: "관통 +1" },
      5: { damage: 6, description: "데미지 +6" },
      6: { count: 2, description: "파편 +2" },
      7: { damage: 10, description: "데미지 +10" },
      8: { damage: 15, count: 3, description: "MAX: 데미지 +15, 파편 +3" },
    },
  },

  W20: {
    id: "W20",
    name: "메테오",
    description: "긴 딜레이 후 화면 전체 초토화",
    pattern: "nuke",
    tags: [ElementType.FIRE],
    baseStats: { damage: 200, cooldown: 15000, count: 1, size: 200, duration: 1000 },
    levels: {
      2: { damage: 50, description: "데미지 +50" },
      3: { cooldown: -2000, description: "쿨타임 -2초" },
      4: { damage: 80, description: "데미지 +80" },
      5: { size: 50, description: "범위 +50" },
      6: { cooldown: -2000, description: "쿨타임 -2초" },
      7: { damage: 120, description: "데미지 +120" },
      8: { damage: 200, size: 100, description: "MAX: 데미지 +200, 범위 +100" },
    },
  },
};
