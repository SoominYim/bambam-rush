import { GameObject, Enemy, Projectile, Collectible, TailSegment, Player } from "@/game/types";
import { XPGemInstance } from "@/game/entities/xpGem";

export const state = {
  entities: [] as GameObject[],
  collectibles: [] as Collectible[],
  tail: [] as TailSegment[],
  enemies: [] as Enemy[],
  projectiles: [] as Projectile[],
  xpGems: [] as XPGemInstance[],
  areas: [] as any[], // Area entities
  player: null as Player | null,
  score: 0,
  isLevelUpPending: false,
  levelUpChoices: [] as any[],
};

export const getPlayer = () => state.player;
export const addEnemy = (e: Enemy) => state.enemies.push(e);
export const addArea = (a: any) => state.areas.push(a);

export const resetEntityStore = (p: Player) => {
  state.player = p;
  state.entities = [p];
  state.collectibles = [];
  state.tail = [];
  state.enemies = [];
  state.projectiles = [];
  state.xpGems = [];
  state.areas = [];
  state.score = 0;
  state.isLevelUpPending = false;
  state.levelUpChoices = [];
};
