export type Scalar = number;

export interface Vector2D {
  x: Scalar;
  y: Scalar;
}

export enum ElementType {
  FIRE = "FIRE",
  WATER = "WATER",
  ICE = "ICE",
  WIND = "WIND",
  POISON = "POISON",
  ELECTRIC = "ELECTRIC",
  SWORD = "SWORD",
  BOOK = "BOOK",

  // Combos
  STEAM = "STEAM",
  LAVA = "LAVA",
  INFERNO = "INFERNO",
  ICEBERG = "ICEBERG",
  STORM = "STORM",
  BLIZZARD = "BLIZZARD",

  // Advanced Combos (from recipes.ts)
  POISON_SWAMP = "POISON_SWAMP", // 맹독 분수
  LIGHTNING_CHAIN = "LIGHTNING_CHAIN", // 번개 체인
  SWORD_DANCE = "SWORD_DANCE", // 검무
  HOLY_SWORD = "HOLY_SWORD", // 신성한 검
  MELTDOWN = "MELTDOWN", // 융해
  PARALYSIS = "PARALYSIS", // 마비 독
  FREEZE_SHOCK = "FREEZE_SHOCK", // 동결 쇼크
  DUAL_SHIELD = "DUAL_SHIELD", // 이중 방어막
}

export interface GameObject {
  id: string;
  position: Vector2D;
  update: (deltaTime: Scalar) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  isExpired?: boolean;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  fireRate: number;
  // Roguelike Stats
  xp: number;
  maxXp: number;
  level: number;
  pickupRange: number;
  hpRegen: number; // HP per second
}

export interface Player extends GameObject {
  stats: PlayerStats;
  magnetTimer?: number;
}

export interface TailSegment extends GameObject {
  type: ElementType;
  tier: number;
  followTarget: GameObject | null;
}

export enum SkillBehavior {
  PROJECTILE = "PROJECTILE",
  ORBITAL = "ORBITAL",
  AREA = "AREA",
  MELEE = "MELEE",
}

export enum CollectibleType {
  MAGNET = "MAGNET",
  POTION = "POTION",
  BOOM = "BOOM", // Bomb? Clears screen?
}

export interface Collectible extends GameObject {
  type: CollectibleType;
  radius: number;
}

export interface XPGem extends GameObject {
  amount: number;
  radius: number;
  isMagnetized?: boolean; // 자력에 끌려오는 중인지
}

export enum EnemyType {
  BASIC = "BASIC",
  FAST = "FAST",
  TANK = "TANK",
  BOSS = "BOSS",
}

export interface Enemy extends GameObject {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
}

export interface Projectile extends GameObject {
  type: ElementType;
  damage: number;
  penetration: number;
  parentID?: string; // 오비탈 스킬용 부모(세그먼트) ID
  startTime?: number; // 장판형/지속형 시작 시간
  duration?: number; // 지속 시간
  angle?: number; // 오비탈 현재 각도
}
