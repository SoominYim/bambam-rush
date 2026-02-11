import { GameObject, Projectile, Collectible, TailSegment, Player } from "@/game/types";
import { vfx } from "@/engine/vfx/ParticleSystem";
import { spatialGrid } from "@/game/managers/grid";
import { XPGemInstance } from "@/game/entities/xpGem";
import { damageTextManager } from "@/game/managers/damageTextManager";
import { applyCardEffect, draftCards } from "@/game/systems/cardSystem";
import { setPaused } from "@/engine/systems/input";
import { waveManager } from "@/game/managers/waveManager";
import { state, resetEntityStore, getPlayer, addEnemy, addArea as storeAddArea } from "./entityStore";
import * as CONFIG from "../config/constants";

export const initGameState = (p: Player) => {
  resetEntityStore(p);
  // Reset Timer & Waves
  waveManager.reset();
};

export const addEntity = (entity: GameObject) => state.entities.push(entity);
export const addCollectible = (c: Collectible) => state.collectibles.push(c);
export const addTailSegment = (segment: TailSegment): void => {
  state.tail.push(segment);
};
export { addEnemy };
export const addProjectile = (p: Projectile) => state.projectiles.push(p);
export const addArea = (a: any) => storeAddArea(a);
export const addXPGem = (x: number, y: number, amount: number) => {
  state.xpGems.push(new XPGemInstance(x, y, amount));
};

export const getEntities = () => state.entities;
export const getCollectibles = () => state.collectibles;
export const getTail = () => state.tail;
export const getEnemies = () => state.enemies;
export const getProjectiles = () => state.projectiles;
export const getXPGems = () => state.xpGems;
export const getAreas = () => state.areas;
export { getPlayer };

// Level Up Interface
export const getLevelUpState = () => ({
  isLevelUpPending: state.isLevelUpPending,
  levelUpChoices: state.levelUpChoices,
  levelUpCounter: state.levelUpCounter,
});

export const selectLevelUpCard = (cardIndex: number) => {
  if (!state.player || !state.isLevelUpPending) return;

  const card = state.levelUpChoices[cardIndex];
  if (card) {
    applyCardEffect(card);
  }

  // pending과 choices 모두 초기화 (checkLevelUp이 다시 레벨업을 감지할 수 있도록)
  state.isLevelUpPending = false;
  state.levelUpChoices = [];

  // 남은 XP로 추가 레벨업이 있는지 체크
  checkLevelUp();

  // 추가 레벨업이 없으면 게임 재개
  if (!state.isLevelUpPending) {
    setPaused(false);
  }
  // 추가 레벨업이 있으면 checkLevelUp 안에서 isLevelUpPending=true, 새 choices 설정, counter++ 처리됨
};

// Score management
export const getScore = () => state.score;
export const addScore = (points: number): void => {
  state.score += points;
};

// Gold management
export const addGold = (amount: number): void => {
  if (state.player) {
    state.player.stats.gold += amount;
  }
};

export const getGold = () => state.player?.stats.gold || 0;

// Game Time (Wave)
export const getGameTime = () => waveManager.getPlayTime();

export const getPlayerStats = () => state.player?.stats || null;

export const updateGameState = (deltaTime: number) => {
  const { player } = state;
  if (player) player.update(deltaTime);
  state.tail.forEach(t => t.update(deltaTime));
  state.collectibles.forEach(c => c.update(deltaTime));
  state.enemies.forEach(e => e.update(deltaTime));
  state.projectiles.forEach(p => p.update(deltaTime));
  state.areas.forEach(a => a.update(deltaTime));

  if (player) {
    const pPos = player.position;
    state.xpGems.forEach(gem => {
      // 1. Check if gem should become magnetized
      if (!gem.isMagnetized) {
        const dx = pPos.x - gem.position.x;
        const dy = pPos.y - gem.position.y;
        const distSq = dx * dx + dy * dy;

        // Active Magnet (Global/Large) vs Passive Magnet (Stats)
        const currentRange =
          player.magnetTimer && player.magnetTimer > 0 ? CONFIG.MAGNET_ITEM_RANGE : player.stats.pickupRange;

        if (distSq < currentRange * currentRange) {
          gem.isMagnetized = true;
        }
      }

      // 2. Update Gem (Attraction logic is inside)
      gem.update(deltaTime, player);

      // Check Collection (Collision with Player)
      const dx = pPos.x - gem.position.x;
      const dy = pPos.y - gem.position.y;
      if (dx * dx + dy * dy < 400) {
        gem.isExpired = true;
        player.stats.xp += gem.amount;
        checkLevelUp();
      }
    });
  }

  // Cleanup
  state.collectibles = state.collectibles.filter(c => !c.isExpired);
  state.enemies = state.enemies.filter(e => !e.isExpired);
  state.projectiles = state.projectiles.filter(p => !p.isExpired);
  state.xpGems = state.xpGems.filter(g => !g.isExpired);
  state.areas = state.areas.filter(a => !a.isExpired);
  state.tail = state.tail.filter(t => !t.isExpired);

  // Update particles
  vfx.update(deltaTime);

  // Update Damage Text
  damageTextManager.update(deltaTime);

  // Update Spatial Grid
  spatialGrid.clear();
  state.enemies.forEach(e => spatialGrid.insert(e));
};

export const drawGameState = (ctx: CanvasRenderingContext2D) => {
  // [Layer 1] Ground Effects (Areas, Pools) - 바닥에 깔리는 요소
  state.areas.forEach(a => a.draw(ctx));

  // [Layer 2] Ground Items (Collectibles, XP Gems)
  state.collectibles.forEach(c => c.draw(ctx));
  state.xpGems.forEach(g => g.draw(ctx));

  // [Layer 3] Characters (Enemies, Tail, Player)
  state.enemies.forEach(e => e.draw(ctx));
  state.tail.forEach(t => t.draw(ctx));
  if (state.player) state.player.draw(ctx);

  // [Layer 4] Low-Flying Objects / Effects
  // ...

  // [Layer 5] High-Flying Projectiles
  state.projectiles.forEach(p => p.draw(ctx));

  // Draw Damage Text
  damageTextManager.draw(ctx);

  // Draw particles
  vfx.draw(ctx);
};

const checkLevelUp = () => {
  if (!state.player) return;

  // 이미 레벨업 대기 중이면 추가 레벨업 처리 안 함 (카드 선택 후 다시 체크됨)
  if (state.isLevelUpPending) return;

  const stats = state.player.stats;
  if (stats.xp >= stats.maxXp) {
    stats.xp -= stats.maxXp;
    stats.level++;
    stats.maxXp = Math.floor(stats.maxXp * 1.5);

    state.isLevelUpPending = true;
    state.levelUpChoices = draftCards(3);
    state.levelUpCounter++;
    setPaused(true);

    stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.1);
  }
};

export const addPlayerXP = (amount: number) => {
  if (!state.player) return;
  state.player.stats.xp += amount;
  checkLevelUp();
};
