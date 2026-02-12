import { ElementType } from "@/game/types";
import { WEAPON_ICONS } from "./weaponIcons";

// 무기 레벨별 스케일링 정의
export interface WeaponLevelScale {
  damage?: number; // 데미지
  attackSpeed?: number; // 공격 속도
  count?: number; // 개수
  size?: number; // 크기
  area?: number; // 면적
  speed?: number; // 속도
  duration?: number; // 지속 시간
  pierce?: number; // 관통
  range?: number; // 사거리
  hitInterval?: number; // Added hitInterval
  orbitRadiusBase?: number; // Added for orbit patterns
  triggerRange?: number; // Added for aggro behaviors
  aggroSpeedMultiplier?: number; // Added for dash speeds
  burnDamage?: number; // 화상 데미지
  burnDuration?: number; // 화상 지속 시간
  explosionRadius?: number; // 폭발 반경
  chainCount?: number; // 전이 횟수
  chainRange?: number; // 전이 범위
  freezeDuration?: number; // 빙결 지속 시간
  chillAmount?: number; // 둔화율 (0.0 ~ 1.0)
  chillDuration?: number; // 둔화 지속 시간
  orbitSpeedAggro?: number; // 적 감지 시 회전 속도
  lifeSteal?: number; // 흡혈량
  description?: string;
}

// 무기 정의
export interface WeaponDefinition {
  id: string;
  name: string;
  icon?: string; // Custom SVG Icon
  description: string;
  pattern:
    | "orbit" // 꼬리 주변을 회전하는 검
    | "projectile" // 발사되는 미사일
    | "line" // 직선으로 발사되는 탄환
    | "chain" // 튕기며 전이되는 번개
    | "area" // 바닥에 지속 피해를 주는 장판
    | "return" // 던지고 회수되는 부메랑
    | "nova" // 폭발하는 구체
    | "trap" // 함정
    | "beam" // 빔
    | "minion" // 미니언
    | "arc" // 아크
    | "vortex" // 소용돌이
    | "bounce" // 튕기는 탄환
    | "aura" // 오라
    | "sky" // 하늘
    | "spread" // 퍼짐
    | "gas" // 가스
    | "linear" // 선형
    | "swing" // 스윙
    | "stab"
    | "nuke"
    | "bat"
    | "flame"; // 화염 방사
  tags: ElementType[];
  baseStats: {
    damage: number;
    attackSpeed: number; // Attacks per second
    count: number;
    size: number;
    speed?: number;
    duration?: number;
    pierce?: number;
    range?: number;
    hitInterval?: number; // Added hitInterval
    orbitRadiusBase?: number;
    triggerRange?: number;
    aggroSpeedMultiplier?: number;
    burnDamage?: number;
    burnDuration?: number;
    explosionRadius?: number;
    chainCount?: number;
    chainRange?: number;
    freezeDuration?: number;
    chillAmount?: number;
    chillDuration?: number;
    orbitSpeedAggro?: number;
    lifeSteal?: number; // 흡혈량
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
    name: "🗡️ 가디언 소드",
    icon: WEAPON_ICONS.GUARDIAN_SWORD,
    description: "꼬리 주변을 수호하며 적을 추적해 찌르는 검",
    pattern: "orbit",
    tags: [ElementType.SWORD],
    baseStats: {
      damage: 10,
      attackSpeed: 10, // Persistent sync rate
      count: 1,
      size: 6,
      speed: 0.7,
      range: 40,
      hitInterval: 200,
      orbitRadiusBase: 10,
      triggerRange: 110,
      aggroSpeedMultiplier: 1,
    },
    levels: {
      2: { damage: 4, size: 2, description: "데미지, 크기 증가" },
      3: { size: 2, range: 30, description: "크기, 사거리 증가" },
      4: { speed: 0.5, attackSpeed: 20, description: "공격 속도 증가" },
      5: { count: 1, description: "검 +1" },
      6: { size: 2, speed: 0.15, description: "크기, 공격 속도 증가" },
      7: { damage: 10, count: 1, description: "데미지, 검 +1 증가" },
      8: { damage: 12, count: 1, size: 5, range: 40, description: "MAX" },
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
    icon: WEAPON_ICONS.MAGIC_MISSILE,
    description: "가장 가까운 적을 추적하는 미사일",
    pattern: "projectile",
    tags: [ElementType.ARCANE],
    baseStats: { damage: 25, attackSpeed: 0.8, count: 1, size: 15, speed: 120, pierce: 1, range: 500 }, // 짧은 사거리에서 시작
    levels: {
      2: { damage: 5, description: "데미지 +5" },
      3: { attackSpeed: 0.2, speed: 30, description: "공격 속도 투사체 속도 증가" },
      4: { count: 1, description: "미사일 +1" },
      5: { damage: 10, speed: 50, description: "데미지 +10, 투사체 속도 증가" },
      6: { count: 1, description: "미사일 +1" },
      7: { attackSpeed: 0.3, speed: 70, description: "공격 속도, 투사체 속도 증가" },
      8: { count: 2, damage: 15, attackSpeed: 0.5, speed: 100, description: "MAX" },
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
    icon: WEAPON_ICONS.FIREBALL,
    description: "강력한 화상을 입히는 화염 탄환",
    pattern: "line",
    tags: [ElementType.FIRE],
    baseStats: {
      damage: 15,
      attackSpeed: 0.6,
      count: 1,
      size: 5,
      speed: 300,
      pierce: 1,
      burnDamage: 10,
      burnDuration: 3000,
      range: 750,
      explosionRadius: 0, // 기본은 폭발 없음
    },
    levels: {
      2: { damage: 10, description: "데미지 +10" },
      3: { explosionRadius: 80, description: "충돌 시 폭발 추가" },
      4: { size: 10, burnDuration: 1000, description: "크기, 화상 시간 증가" },
      5: { count: 1, description: "화염구 +1" },
      6: { explosionRadius: 40, burnDamage: 10, description: "폭발 범위 및 화상 데미지 증가" },
      7: { pierce: 1, description: "관통 +1" },
      8: { damage: 20, burnDamage: 30, explosionRadius: 80, description: "MAX" },
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
    icon: WEAPON_ICONS.CHAIN_LIGHTNING,
    description: "적들 사이를 튕기며 전이되는 번개",
    pattern: "chain",
    tags: [ElementType.ELECTRIC],
    baseStats: {
      damage: 18,
      attackSpeed: 0.5,
      count: 1,
      size: 5,
      speed: 600,
      range: 400,
      chainCount: 3,
      chainRange: 150,
    },
    levels: {
      2: { damage: 5, description: "데미지 +5" },
      3: { chainCount: 1, description: "전이 횟수 +1" },
      4: { attackSpeed: 0.1, description: "공격 속도 증가" },
      5: { damage: 10, chainRange: 50, description: "데미지 +10, 전이 거리 증가" },
      6: { chainCount: 2, count: 1, description: "전이 횟수 +2, 줄기 +1" },
      7: { attackSpeed: 0.15, chainRange: 50, description: "공격 속도, 전이 거리 증가" },
      8: { damage: 20, chainCount: 4, count: 1, description: "MAX: 데미지 +20, 전이+4, 줄기+1" },
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
    icon: WEAPON_ICONS.POISON_PUDDLE,
    description: "바닥에 지속 피해를 주는 독 장판 생성",
    pattern: "area",
    tags: [ElementType.POISON],
    baseStats: {
      damage: 15,
      attackSpeed: 0.6,
      count: 1,
      size: 80,
      duration: 3500,
      speed: 200,
      range: 250, // 초반엔 좀 좁게 설정
    },
    levels: {
      2: { damage: 5, description: "데미지 +5 (중독 피해 +1)" },
      3: { duration: 1000, range: 50, description: "지속시간 +1초, 사거리 +50" },
      4: { size: 25, description: "웅덩이 범위 +25" },
      5: { count: 1, description: "웅덩이 투척 개수 +1" },
      6: { damage: 8, duration: 1000, size: 15, range: 50, description: "스펙 전반 강화 (중독 피해 증가)" },
      7: { attackSpeed: 0.2, description: "공격 속도 증가" },
      8: { damage: 15, count: 1, size: 30, range: 100, description: "MAX 강림 (강력한 중독)" },
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
    icon: WEAPON_ICONS.BOOMERANG,
    description: "적들을 관통하며 돌아오는 바람의 칼날",
    pattern: "return",
    tags: [ElementType.WIND],
    baseStats: { damage: 35, attackSpeed: 0.5, count: 1, size: 24, speed: 450, pierce: 999 },
    levels: {
      2: { damage: 7, description: "데미지 +7" },
      3: { count: 1, description: "부메랑 +1" },
      4: { speed: 50, description: "속도 +50" },
      5: { damage: 12, description: "데미지 +12" },
      6: { count: 1, description: "부메랑 +1" },
      7: { damage: 15, size: 10, description: "데미지 +15, 크기 +10" },
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
    icon: WEAPON_ICONS.FROST_NOVA,
    description: "적중 시 폭발하여 주변을 얼리는 얼음 보주 발사",
    pattern: "projectile", // 투사체로 변경
    tags: [ElementType.ICE],
    baseStats: {
      damage: 30,
      attackSpeed: 0.8,
      count: 1,
      size: 5, // 투사체 크기
      speed: 400,
      explosionRadius: 20, // 폭발 반경
      chillAmount: 0.1, // 초반엔 10% 둔화 (약함)
      chillDuration: 3000,
    },
    levels: {
      2: { damage: 10, description: "데미지 +10" },
      3: { explosionRadius: 40, chillAmount: 0.1, description: "폭발 범위 +40, 둔화 +10%" },
      4: { attackSpeed: 0.2, description: "공격 속도 증가" },
      5: { freezeDuration: 1000, description: "빙결 효과 추가 (1초)" }, // 5렙부터 얼음!
      6: { explosionRadius: 50, description: "폭발 범위 +50" },
      7: { count: 1, description: "투사체 +1" },
      8: {
        damage: 30,
        explosionRadius: 60,
        chillAmount: 0.2, // 총 40% (0.1+0.1+0.2)
        freezeDuration: 500, // 총 1.5초
        description: "MAX: 절대 영도 (강력한 빙결)",
      },
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
    icon: WEAPON_ICONS.GUARDIAN_ORB,
    description: "주변을 회전하며 적을 막아내는 수호 구슬",
    pattern: "orbit",
    tags: [ElementType.LIGHT],
    baseStats: {
      damage: 30, // 기본 데미지 대폭 상향 (15 -> 30)
      attackSpeed: 10,
      count: 2,
      size: 10,
      speed: 1.8,
      orbitRadiusBase: 40, // 플레이어 중심 (완전 밀착)
      hitInterval: 100, // 초당 10회 타격 (유지)
    },
    levels: {
      2: { damage: 10, description: "데미지 +10" },
      3: { count: 1, description: "구슬 +1" },
      4: { damage: 15, description: "데미지 +15" },
      5: { size: 5, description: "크기 +5" },
      6: { count: 1, description: "구슬 +1" },
      7: { damage: 25, description: "데미지 +25" },
      8: { count: 2, damage: 50, description: "MAX: 구슬 +2, 데미지 +50" }, // 폭딜
    },
  },

  W09: {
    id: "W09",
    name: "바늘 지뢰",
    icon: WEAPON_ICONS.NEEDLE_MINE,
    description: "밟으면 강력한 폭발을 일으키는 지뢰 설치",
    pattern: "trap",
    tags: [ElementType.PHYSICAL],
    baseStats: { damage: 20, attackSpeed: 0.5, count: 1, size: 10, duration: 10000 },
    levels: {
      2: { damage: 20, description: "데미지 +20" },
      3: { size: 10, duration: 5000, description: "범위 +10, 지속시간 +5초" },
      4: { damage: 20, description: "데미지 +20" },
      5: { count: 1, description: "지뢰 투척 개수 +1" },
      6: { damage: 20, size: 10, description: "데미지 +20, 폭발 범위 +10" },
      7: { attackSpeed: 0.5, description: "설치 속도 증가" },
      8: { damage: 30, count: 2, size: 15, description: "MAX: 데미지 +30, 지뢰 +2, 범위 +15" },
    },
  },

  W10: {
    id: "W10",
    name: "레이저 빔",
    icon: WEAPON_ICONS.LASER_BEAM,
    description: "관통하는 강력한 레이저 발사",
    pattern: "beam",
    tags: [ElementType.TECH],
    baseStats: { damage: 20, attackSpeed: 0.5, count: 1, size: 10, duration: 1000, pierce: 999 }, // 강력한 한 방 (애니메이션 1초)
    levels: {
      2: { damage: 10, description: "데미지 +10" },
      3: { count: 1, description: "레이저 +1" },
      4: { damage: 20, description: "데미지 +20" },
      5: { size: 5, description: "폭 +5" },
      6: { count: 1, description: "레이저 +1" },
      7: { damage: 30, description: "데미지 +30" },
      8: { damage: 30, count: 2, size: 10, description: "MAX: 레이저 +2, 데미지 +30" },
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
    icon: WEAPON_ICONS.SUMMON_BAT,
    description: "적을 추적하여 체력을 흡수하는 박쥐 소환",
    pattern: "bat",
    tags: [ElementType.BLOOD],
    baseStats: { damage: 20, attackSpeed: 0.5, count: 2, size: 8, speed: 200, duration: 5000, lifeSteal: 0.5 },
    levels: {
      2: { count: 2, attackSpeed: 0.2, description: "박쥐 +2, 공격 속도 증가" },
      3: { damage: 3, description: "데미지 +3" },
      4: { count: 2, description: "박쥐 +2" },
      5: { damage: 5, description: "데미지 +5" },
      6: { count: 2, lifeSteal: 0.5, description: "박쥐 +2, 흡혈량 증가" },
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
    icon: WEAPON_ICONS.AXE_THROW,
    description: "높은 곡사로 던져 여러 적을 관통",
    pattern: "projectile",
    tags: [ElementType.PHYSICAL],
    baseStats: { damage: 25, attackSpeed: 0.29, count: 1, size: 20, speed: 180, pierce: 3 },
    levels: {
      2: { damage: 20, description: "데미지 +20" },
      3: { size: 15, pierce: 1, description: "범위 +15, 관통 +1" },
      4: { damage: 15, count: 1, description: "데미지 +15, 도끼 +1" },
      5: { count: 1, attackSpeed: 0.2, description: "도끼 +1, 공격 속도 증가 " },
      6: { pierce: 2, damage: 20, description: "관통 +2, 데미지 +20" },
      7: { size: 25, count: 1, description: "범위 +25, 도끼 +1" },
      8: {
        damage: 35,
        count: 1,
        attackSpeed: 0.2,
        pierce: 999,
        description: "MAX: 데미지 +35, 공격 속도 증가, 도끼 +1, 관통 무한",
      },
    },
  },

  W13: {
    id: "W13",
    name: "블랙홀",
    icon: WEAPON_ICONS.BLACK_HOLE,
    description: "느린 중력 구체를 발사, 적에게 적중하면 블랙홀 생성",
    pattern: "vortex",
    tags: [ElementType.GRAVITY],
    baseStats: { damage: 15, attackSpeed: 0.2, count: 1, size: 60, speed: 120, duration: 3000 },
    levels: {
      2: { damage: 5, size: 10, description: "데미지 +5, 범위 +10" },
      3: { duration: 1000, description: "지속시간 +1초" },
      4: { damage: 8, size: 15, description: "데미지 +8, 범위 +15" },
      5: { count: 1, description: "블랙홀 +1" },
      6: { damage: 10, duration: 1000, description: "데미지 +10, 지속시간 +1초" },
      7: { size: 20, speed: 30, description: "범위 +20, 투사체 속도 증가" },
      8: { damage: 20, size: 25, count: 1, description: "MAX: 중력 붕괴 (데미지 +20, 범위 +25, 블랙홀 +1)" },
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
    icon: WEAPON_ICONS.CHAKRAM,
    description: "적들 사이를 튕기며 베는 회전 칼날",
    pattern: "bounce",
    tags: [ElementType.WIND],
    baseStats: { damage: 25, attackSpeed: 0.56, count: 2, size: 16, speed: 300, pierce: 4 },
    levels: {
      2: { damage: 8, description: "데미지 +8" },
      3: { pierce: 2, description: "튕김 +2" },
      4: { damage: 12, count: 1, description: "데미지 +12, 차크람 +1" },
      5: { damage: 10, speed: 30, description: "데미지 +10, 투사체 속도 증가" },
      6: { pierce: 3, description: "튕김 +3" },
      7: { damage: 15, count: 1, description: "데미지 +15, 차크람 +1" },
      8: { damage: 25, pierce: 3, count: 1, description: "MAX: 폭풍의 칼날 (데미지 +25, 튕김 +3, 차크람 +1)" },
    },
  },

  W15: {
    id: "W15",
    name: "인페르노",
    icon: WEAPON_ICONS.FLAMETHROWER,
    description: "가까운 적을 녹여버리는 고열의 화염 방사",
    pattern: "flame",
    tags: [ElementType.FIRE],
    baseStats: {
      damage: 2, // 틱당 데미지
      attackSpeed: 0.8, // 1~2초마다 한 번씩 방사 (공격 주기)
      count: 1,
      size: 160, // 1레벨 사이즈 축소 (250 -> 160)
      speed: 0, // 투사체 아님
      duration: 600, // 지속 시간 단축
      pierce: 999,
    },
    levels: {
      2: { damage: 4, description: "데미지 +4" },
      3: { size: 50, duration: 100, description: "사거리 증가" },
      4: { attackSpeed: 3.0, description: "연사 속도 증가" },
      5: { damage: 5, description: "데미지 +5" },
      6: { size: 50, duration: 100, description: "사거리 증가" },
      7: { damage: 8, attackSpeed: 3.0, description: "공격력 대폭 강화" },
      8: { damage: 10, count: 1, description: "MAX: 쌍발 엔진 (화염 줄기 +1)" },
    },
    evolution: {
      requiredPassive: "P01", // Might (Damage)
      evolvedId: "W15_EVO",
      evolvedName: "🔥 헬파이어",
    },
  },

  W16: {
    id: "W16",
    name: "천둥 번개",
    icon: WEAPON_ICONS.THUNDERSTORM,
    description: "하늘에서 랜덤하게 떨어지는 벼락",
    pattern: "sky",
    tags: [ElementType.ELECTRIC],
    baseStats: { damage: 60, attackSpeed: 0.25, count: 1, size: 50, duration: 500 },
    levels: {
      2: { damage: 15, description: "데미지 +15" },
      3: { count: 1, description: "벼락 +1" },
      4: { damage: 20, description: "데미지 +20" },
      5: { attackSpeed: 0.03, description: "공격 속도 증가" },
      6: { count: 1, description: "벼락 +1" },
      7: { damage: 30, description: "데미지 +30" },
      8: { damage: 50, count: 2, description: "MAX: 데미지 +50, 벼락 +2" },
    },
  },

  W17: {
    id: "W17",
    name: "샷건",
    icon: WEAPON_ICONS.SHOTGUN,
    description: "부채꼴 범위로 탄환 발사",
    pattern: "spread",
    tags: [ElementType.TECH],
    baseStats: { damage: 12, attackSpeed: 0.83, count: 5, size: 12, speed: 320, pierce: 1 },
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
    icon: WEAPON_ICONS.PLAGUE_CLOUD,
    description: "움직이는 독구름 생성",
    pattern: "gas",
    tags: [ElementType.POISON],
    baseStats: { damage: 8, attackSpeed: 0.33, count: 1, size: 100, duration: 5000, speed: 50 },
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
    icon: WEAPON_ICONS.ICE_SHARD,
    description: "적을 느리게 하는 빠른 투사체",
    pattern: "linear",
    tags: [ElementType.ICE],
    baseStats: { damage: 18, attackSpeed: 1.0, count: 3, size: 14, speed: 400, pierce: 2 },
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
    icon: WEAPON_ICONS.METEOR,
    description: "긴 딜레이 후 화면 전체 초토화",
    pattern: "nuke",
    tags: [ElementType.FIRE],
    baseStats: { damage: 200, attackSpeed: 0.07, count: 1, size: 200, duration: 1000 },
    levels: {
      2: { damage: 50, description: "데미지 +50" },
      3: { attackSpeed: 0.01, description: "공격 속도 증가" },
      4: { damage: 80, description: "데미지 +80" },
      5: { size: 50, description: "범위 +50" },
      6: { attackSpeed: 0.01, description: "공격 속도 증가" },
      7: { damage: 120, description: "데미지 +120" },
      8: { damage: 200, size: 100, description: "MAX: 데미지 +200, 범위 +100" },
    },
  },
  W06_EVO: {
    id: "W06_EVO",
    name: "🌀 스톰 룰러",
    icon: WEAPON_ICONS.STORM_RULER,
    description: "폭풍을 휘감은 거대한 부메랑 (무한 관통)",
    pattern: "return",
    tags: [ElementType.WIND, ElementType.STORM],
    baseStats: {
      damage: 60,
      attackSpeed: 0.8,
      count: 2,
      size: 40,
      speed: 600,
      pierce: 999,
    },
    levels: {
      2: { damage: 15, description: "데미지 +15" },
      3: { count: 1, description: "부메랑 +1" },
      4: { speed: 100, size: 10, description: "속도 +100, 크기 +10" },
      5: { damage: 25, description: "데미지 +25" },
      6: { count: 1, description: "부메랑 +1" },
      7: { attackSpeed: 0.2, description: "공격 속도 증가" },
      8: { damage: 50, count: 2, size: 20, description: "MAX: 폭풍의 지배자" },
    },
  },
};
