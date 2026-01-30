export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2D;
  update: (deltaTime: number) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  isExpired?: boolean; // True if object should be removed
}

export enum SpellType {
  FIRE = "FIRE",
  WATER = "WATER",
  ICE = "ICE",
  WIND = "WIND",
  NONE = "NONE",
}

export interface SpellCombo {
  elements: SpellType[];
  resultName: string;
  damageMultiplier: number;
  effect: string;
}
