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
  PHYSICAL = "PHYSICAL",
  ARCANE = "ARCANE",
  TECH = "TECH",
  LIGHT = "LIGHT",
  BLOOD = "BLOOD",
  GRAVITY = "GRAVITY",

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
  fireRate: number; // Attack Speed Multiplier
  moveSpeed: number; // Movement Speed

  // Roguelike Stats (Multipliers & Additives)
  projectileSpeed: number; // Projectile Speed Multiplier (Default 1.0)
  duration: number; // Duration Multiplier (Default 1.0)
  area: number; // Area Size Multiplier (Default 1.0)
  cooldown: number; // Cooldown Reduction (0.0 ~ 1.0, Default 0)
  amount: number; // Additional Projectiles (Default 0)
  luck: number; // Luck (Crit Chance etc, Default 1.0)
  revival: number; // Revives Count

  // Growth
  xp: number;
  maxXp: number;
  level: number;
  gold: number; // Gold collected this run
  pickupRange: number; // Magnet Range
  hpRegen: number; // HP per sec
}

export interface Player extends GameObject {
  characterId?: string;
  stats: PlayerStats;
  direction: Vector2D; // Current facing/moving direction
  magnetTimer?: number;
  activeWeapons: ActiveWeapon[];
  passives: PassiveInstance[];
}

export type WeaponPattern =
  | "orbit"
  | "projectile"
  | "line"
  | "area"
  | "trail"
  | "nova"
  | "drone"
  | "formation"
  | "chain"
  | "return"
  | "beam"
  | "vortex"
  | "trap"
  | "aura"
  | "sky";

export interface ActiveWeapon {
  id: string;
  level: number;
  timer: number;
  lastFired: number;
}

export interface PassiveInstance {
  id: string;
  level: number;
}

export interface TailSegment extends GameObject {
  type: ElementType;
  tier: number;
  followTarget: GameObject | null;
  weaponId: string;
  levelUpTimer?: number; // Time remaining for Level Up effect
  levelUpDescription?: string; // Description for the last level up
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

export enum StatusEffectType {
  BURN = "BURN",
  CHILL = "CHILL",
  SHOCK = "SHOCK",
  POISON = "POISON",
  FREEZE = "FREEZE",
}

export interface StatusEffect {
  type: StatusEffectType;
  damage: number; // tick당 데미지
  duration: number; // 남은 시간 (ms)
  lastTick: number; // 마지막 데미지 시각
  tickInterval: number; // 데미지 주기 (ms)
  value?: number; // 둔화율 등 (0.0 ~ 1.0)
}

export interface Enemy extends GameObject {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  defense: number; // 방어력 추가
  statusEffects: StatusEffect[]; // 추가됨
}

export interface Projectile extends GameObject {
  type: ElementType;
  damage: number;
  penetration: number;
  parentID?: string; // 오비탈 스킬용 부모(세그먼트) ID
  startTime?: number; // 장판형/지속형 시작 시간
  duration?: number; // 지속 시간
  angle?: number; // 오비탈 현재 각도
  owner?: GameObject; // 소유자 (플레이어 또는 꼬리)
  weaponId?: string; // 무기 ID

  // 상태 이상 속성
  chillAmount?: number;
  chillDuration?: number;
  freezeDuration?: number;

  // Hit Logic (Default: 200ms)
  hitTracker?: Record<string, number>;
  hitInterval?: number;
}
