import { GameObject, Enemy, Projectile, Collectible, TailSegment, Player } from "@/game/types";
import { vfx } from "@/engine/vfx/ParticleSystem";
import { spatialGrid } from "@/game/managers/grid";

let entities: GameObject[] = [];
let collectibles: Collectible[] = [];
let tail: TailSegment[] = [];
let enemies: Enemy[] = [];
let projectiles: Projectile[] = [];
let player: Player | null = null;
let score: number = 0;

export const initGameState = (p: Player) => {
  player = p;
  entities = [p];
  collectibles = [];
  tail = [];
  enemies = [];
  projectiles = [];
  score = 0;
};

export const addEntity = (entity: GameObject) => entities.push(entity);
export const addCollectible = (c: Collectible) => collectibles.push(c);
export const addTailSegment = (segment: TailSegment): void => {
  tail.push(segment);
};
export const addEnemy = (e: Enemy) => enemies.push(e);
export const addProjectile = (p: Projectile) => projectiles.push(p);

export const getEntities = () => entities;
export const getCollectibles = () => collectibles;
export const getTail = () => tail;
export const getEnemies = () => enemies;
export const getProjectiles = () => projectiles;
export const getPlayer = () => player;

// Score management
export const getScore = () => score;
export const addScore = (points: number): void => {
  score += points;
  // console.log removed for performance
};

export const getPlayerStats = () => player?.stats || null;

export const updateGameState = (deltaTime: number) => {
  if (player) player.update(deltaTime);
  tail.forEach(t => t.update(deltaTime)); // 꼬리도 업데이트해야 플레이어를 따라다님!
  collectibles.forEach(c => c.update(deltaTime));
  enemies.forEach(e => e.update(deltaTime));
  projectiles.forEach(p => p.update(deltaTime));

  // Cleanup
  collectibles = collectibles.filter(c => !c.isExpired);
  enemies = enemies.filter(e => !e.isExpired);
  projectiles = projectiles.filter(p => !p.isExpired);
  tail = tail.filter(t => !t.isExpired);

  // Update particles
  vfx.update(deltaTime);

  // Update Spatial Grid for efficient combat lookups
  spatialGrid.clear();
  enemies.forEach(e => spatialGrid.insert(e));
};

export const drawGameState = (ctx: CanvasRenderingContext2D) => {
  collectibles.forEach(c => c.draw(ctx));
  enemies.forEach(e => e.draw(ctx));

  tail.forEach(t => t.draw(ctx));

  if (player) player.draw(ctx);
  projectiles.forEach(p => p.draw(ctx));

  // Draw particles
  vfx.draw(ctx);
};
