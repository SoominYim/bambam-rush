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

  // Combos
  STEAM = "STEAM", // Fire + Water
  LAVA = "LAVA", // Fire + Ice
  INFERNO = "INFERNO", // Fire + Wind
  ICEBERG = "ICEBERG", // Water + Ice
  STORM = "STORM", // Water + Wind
  BLIZZARD = "BLIZZARD", // Ice + Wind
}

export interface GameObject {
  id: string;
  position: Vector2D;
  update: (deltaTime: Scalar) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  isExpired?: boolean;
}

export interface TailSegment extends GameObject {
  type: ElementType;
  tier: number;
  followTarget: GameObject | null;
}

export interface Collectible extends GameObject {
  type: ElementType;
  tier: number;
  radius: number;
}

export interface Enemy extends GameObject {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
}

export interface Projectile extends GameObject {
  damage: number;
  penetration: number;
}
