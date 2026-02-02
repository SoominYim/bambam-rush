import { GameObject, Enemy, Projectile, Collectible, TailSegment, Player } from "@/game/types";
import { vfx } from "@/engine/vfx/ParticleSystem";
import { spatialGrid } from "@/game/managers/grid";
import { XPGemInstance } from "@/game/entities/xpGem";
import { damageTextManager } from "@/game/managers/damageTextManager";
import { Card, draftCards, applyCardEffect } from "@/game/systems/cardSystem";
import { setPaused } from "@/engine/systems/input";

let entities: GameObject[] = [];
let collectibles: Collectible[] = [];
let tail: TailSegment[] = [];
let enemies: Enemy[] = [];
let projectiles: Projectile[] = [];
let xpGems: XPGemInstance[] = [];
let player: Player | null = null;
let score: number = 0;

// Level Up State
let isLevelUpPending = false;
let levelUpChoices: Card[] = [];

export const initGameState = (p: Player) => {
  player = p;
  entities = [p];
  collectibles = [];
  tail = [];
  enemies = [];
  projectiles = [];
  xpGems = [];
  score = 0;
};

export const addEntity = (entity: GameObject) => entities.push(entity);
export const addCollectible = (c: Collectible) => collectibles.push(c);
export const addTailSegment = (segment: TailSegment): void => {
  tail.push(segment);
};
export const addEnemy = (e: Enemy) => enemies.push(e);
export const addProjectile = (p: Projectile) => projectiles.push(p);
export const addXPGem = (x: number, y: number, amount: number) => xpGems.push(new XPGemInstance(x, y, amount));

export const getEntities = () => entities;
export const getCollectibles = () => collectibles;
export const getTail = () => tail;
export const getEnemies = () => enemies;
export const getProjectiles = () => projectiles;
export const getXPGems = () => xpGems;
export const getPlayer = () => player;

// Level Up Interface
export const getLevelUpState = () => ({
  isLevelUpPending,
  levelUpChoices,
});

export const selectLevelUpCard = (cardIndex: number) => {
  if (!player || !isLevelUpPending) return;

  const card = levelUpChoices[cardIndex];
  if (card) {
    applyCardEffect(card);
  }

  // Reset State
  isLevelUpPending = false;
  levelUpChoices = [];

  // Resume Game
  setPaused(false);
};

import { waveManager } from "@/game/managers/waveManager";

// Score management
export const getScore = () => score;
export const addScore = (points: number): void => {
  score += points;
};

// Game Time (Wave)
export const getGameTime = () => waveManager.getPlayTime();

export const getPlayerStats = () => player?.stats || null;

export const updateGameState = (deltaTime: number) => {
  if (player) player.update(deltaTime);
  tail.forEach(t => t.update(deltaTime)); // 꼬리도 업데이트해야 플레이어를 따라다님!
  collectibles.forEach(c => c.update(deltaTime));
  enemies.forEach(e => e.update(deltaTime));
  projectiles.forEach(p => p.update(deltaTime));

  if (player) {
    const pPos = player.position;
    // Effective Pickup Range: If magnetTimer is active, global pickup.
    const pickupRange = player.magnetTimer && player.magnetTimer > 0 ? 9999 : player.stats.pickupRange;
    const magnetRangeSq = pickupRange * pickupRange;

    xpGems.forEach(gem => {
      // Check Magnet
      if (!gem.isMagnetized) {
        const dx = pPos.x - gem.position.x;
        const dy = pPos.y - gem.position.y;
        if (dx * dx + dy * dy < magnetRangeSq) {
          gem.isMagnetized = true;
        }
      }

      gem.update(deltaTime, player!);

      // Check Collection (Collision with Player)
      // Radius ~20 for collection
      const dx = pPos.x - gem.position.x;
      const dy = pPos.y - gem.position.y;
      if (dx * dx + dy * dy < 400) {
        // 20*20
        // Collect!
        gem.isExpired = true;
        player!.stats.xp += gem.amount;
        checkLevelUp();
      }
    });
  }

  // Cleanup
  collectibles = collectibles.filter(c => !c.isExpired);
  enemies = enemies.filter(e => !e.isExpired);
  projectiles = projectiles.filter(p => !p.isExpired);
  xpGems = xpGems.filter(g => !g.isExpired);
  tail = tail.filter(t => !t.isExpired);

  // Update particles
  vfx.update(deltaTime);

  // Update Damage Text
  damageTextManager.update(deltaTime);

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
  xpGems.forEach(g => g.draw(ctx));

  // Draw Damage Text
  damageTextManager.draw(ctx);

  // Draw particles
  vfx.draw(ctx);
};

const checkLevelUp = () => {
  if (!player) return;

  const stats = player.stats;
  if (stats.xp >= stats.maxXp) {
    // Level Up!
    stats.xp -= stats.maxXp;
    stats.level++;
    stats.maxXp = Math.floor(stats.maxXp * 1.5); // Increase XP requirement

    // Trigger Level Up UI
    isLevelUpPending = true;
    levelUpChoices = draftCards(3);
    setPaused(true);

    // Heal slightly on level up?
    stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.1);
  }
};
