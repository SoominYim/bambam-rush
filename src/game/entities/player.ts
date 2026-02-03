import {
  Vector2D,
  TailSegment,
  Scalar,
  ElementType,
  GameObject,
  Player,
  PlayerStats,
  CollectibleType,
} from "@/game/types";
import { getMovementDirection } from "@/engine/systems/input";
import { getTail, getCollectibles, addScore, getPlayer, getEnemies } from "@/game/managers/state";
import { VFXFactory } from "@/engine/vfx/VFXFactory";
import * as CONFIG from "../config/constants";
import { drawCharacter } from "@/game/utils/characterRenderer";

// Position history for snake-like trailing (Breadcrumb system)
let positionHistory: Vector2D[] = [];
const HISTORY_SPACING = 2; // Resolution of path tracking (Higher = smoother, more memory)
const MAX_HISTORY = 5000; // Allow for very long snakes

export const getPositionHistory = () => positionHistory;
export const resetPositionHistory = () => {
  positionHistory = [];
};

export const createPlayer = (startX: Scalar, startY: Scalar, characterId: string = "BASIC"): Player => {
  positionHistory = [{ x: startX, y: startY }];

  const stats: PlayerStats = {
    hp: CONFIG.PLAYER_BASE_HP,
    maxHp: CONFIG.PLAYER_BASE_HP,
    atk: CONFIG.PLAYER_BASE_ATK,
    def: CONFIG.PLAYER_BASE_DEF,
    fireRate: CONFIG.PLAYER_BASE_FIRE_RATE,
    // Roguelike Stats
    xp: 0,
    maxXp: 100, // Initial XP required for level 2
    level: 1,
    gold: 0,
    pickupRange: 60, // Magnet range (base)
    magnetPower: CONFIG.MAGNET_BASE_POWER,
    hpRegen: 0.5, // 0.5 HP per second base
  };

  const player: Player = {
    id: "snake_head",
    characterId: characterId,
    position: { x: startX, y: startY },
    direction: { x: 0, y: -1 }, // Start moving UP
    stats: stats,
    magnetTimer: 0,
    activeWeapons: [],
    passives: [],

    update: function (deltaTime: Scalar) {
      const inputDir = getMovementDirection();
      const speedMult = this.stats.speed || 1.0;

      // 1. Direction Interpolation (Snake.io Core)
      // If there's input, gradually turn towards it.
      // If no input, keep moving in the last direction.
      if (inputDir.x !== 0 || inputDir.y !== 0) {
        // Interpolate current direction towards input direction
        const turnSpeed = CONFIG.PLAYER_TURN_SPEED;
        this.direction.x += (inputDir.x - this.direction.x) * turnSpeed * deltaTime;
        this.direction.y += (inputDir.y - this.direction.y) * turnSpeed * deltaTime;

        // Re-normalize to maintain unit length
        const len = Math.sqrt(this.direction.x ** 2 + this.direction.y ** 2);
        if (len > 0) {
          this.direction.x /= len;
          this.direction.y /= len;
        }
      }

      // 2. Always Move Forward
      const prevX = this.position.x;
      const prevY = this.position.y;

      this.position.x += this.direction.x * CONFIG.PLAYER_SPEED * speedMult * deltaTime;
      this.position.y += this.direction.y * CONFIG.PLAYER_SPEED * speedMult * deltaTime;

      // 3. Boundary Collision
      this.position.x = Math.max(
        CONFIG.PLAYER_RADIUS,
        Math.min(CONFIG.WORLD_WIDTH - CONFIG.PLAYER_RADIUS, this.position.x),
      );
      this.position.y = Math.max(
        CONFIG.PLAYER_RADIUS,
        Math.min(CONFIG.WORLD_HEIGHT - CONFIG.PLAYER_RADIUS, this.position.y),
      );

      // 4. Record position history for tail (Breadcrumb system)
      const dx = this.position.x - prevX;
      const dy = this.position.y - prevY;
      const moved = Math.sqrt(dx * dx + dy * dy);

      if (moved > 0.1) {
        const lastPoint = positionHistory[0];
        const distFromLast = lastPoint
          ? Math.sqrt((this.position.x - lastPoint.x) ** 2 + (this.position.y - lastPoint.y) ** 2)
          : 999;

        if (distFromLast >= HISTORY_SPACING) {
          positionHistory.unshift({ x: this.position.x, y: this.position.y });
          if (positionHistory.length > MAX_HISTORY) {
            positionHistory.pop();
          }
        }
      }

      // Systems
      checkCollection(this);

      // HP Regen
      if (this.stats.hp < this.stats.maxHp) {
        this.stats.hp += this.stats.hpRegen * deltaTime;
        if (this.stats.hp > this.stats.maxHp) this.stats.hp = this.stats.maxHp;
      }

      // Magnet Timer
      if (this.magnetTimer && this.magnetTimer > 0) {
        this.magnetTimer -= deltaTime;
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save();

      // Magnet Effect (Subtle Aura)
      if (this.magnetTimer && this.magnetTimer > 0) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, CONFIG.PLAYER_RADIUS + 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(100, 255, 218, 0.15)";
        ctx.fill();
      }

      // Draw Head
      drawCharacter(ctx, this.position.x, this.position.y, this.characterId || "BASIC", CONFIG.PLAYER_RADIUS);

      ctx.restore();
    },
  };

  return player;
};

const checkCollection = (head: GameObject) => {
  const collectibles = getCollectibles();

  collectibles.forEach(c => {
    if (c.isExpired) return;

    const dx = head.position.x - c.position.x;
    const dy = head.position.y - c.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CONFIG.COLLECTION_RADIUS) {
      c.isExpired = true;
      addScore(CONFIG.COLLECTION_SCORE);

      const player = getPlayer();
      if (!player) return;

      switch (c.type) {
        case CollectibleType.MAGNET:
          player.magnetTimer = 10; // 10 seconds magnet
          console.log("Magnet Activated!");
          break;
        case CollectibleType.POTION:
          player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 50);
          console.log("Healed 50 HP!");
          break;
        case CollectibleType.BOOM:
          // Kill all enemies on screen (or large radius)
          const enemies = getEnemies();
          enemies.forEach(e => {
            e.hp = 0; // Instant kill
            // Add score/xp handled in enemy update
          });
          console.log("BOOM! Screen Cleared!");
          break;
      }
    }
  });
};

export const createTailSegment = (_index: number, elementType: ElementType): TailSegment => {
  const pointsPerSegment = Math.round(CONFIG.SNAKE_SEGMENT_SPACING / HISTORY_SPACING);

  return {
    id: `tail_${Date.now()}_${Math.random()}`,
    position: { x: 0, y: 0 },
    type: elementType,
    tier: 1,
    followTarget: null,
    weaponId: "", // To be assigned

    update: function (_deltaTime: Scalar) {
      const history = getPositionHistory();
      const tail = getTail();
      const myIndexInTail = tail.indexOf(this);

      if (myIndexInTail === -1) return;

      // Calculate path following index
      const historyIndex = (myIndexInTail + 1) * pointsPerSegment;

      if (historyIndex < history.length) {
        const targetPos = history[historyIndex];
        this.position.x = targetPos.x;
        this.position.y = targetPos.y;
      } else if (history.length > 0) {
        const fallbackPos = history[history.length - 1];
        this.position.x = fallbackPos.x;
        this.position.y = fallbackPos.y;
      }

      // Visual particles
      if (Math.random() < 0.05) {
        VFXFactory.createTrail(this.position.x, this.position.y, this.type);
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      let icon = "❓";
      let color = "#ccc";

      // Scale tail segment to match Main Character Size but slightly smaller
      const size = CONFIG.PLAYER_RADIUS * 0.85; // 85% of player size
      const x = Math.round(this.position.x);
      const y = Math.round(this.position.y);

      switch (this.type) {
        case ElementType.FIRE:
          icon = "🔥";
          color = "#ff4400";
          break;
        case ElementType.WATER:
          icon = "💧";
          color = "#0088ff";
          break;
        case ElementType.ICE:
          icon = "❄️";
          color = "#00ffff";
          break;
        case ElementType.WIND:
          icon = "💨";
          color = "#00ff88";
          break;
        case ElementType.POISON:
          icon = "☠️";
          color = "#aa00ff";
          break;
        case ElementType.ELECTRIC:
          icon = "⚡";
          color = "#ffff00";
          break;
        case ElementType.SWORD:
          icon = "🗡️";
          color = "#cccccc";
          break;
        case ElementType.BOOK:
          icon = "📖";
          color = "#885522";
          break;
        case ElementType.INFERNO:
          icon = "☄️";
          color = "#ff4400";
          break;
        case ElementType.BLIZZARD:
          icon = "🌨️";
          color = "#ccffff";
          break;
        case ElementType.POISON_SWAMP:
          icon = "🟣";
          color = "#880088";
          break;
        case ElementType.LIGHTNING_CHAIN:
          icon = "🌩️";
          color = "#ffff00";
          break;
        case ElementType.SWORD_DANCE:
          icon = "⚔️";
          color = "#ffffff";
          break;
        case ElementType.STEAM:
          icon = "☁️";
          color = "#dddddd";
          break;
        case ElementType.LAVA:
          icon = "🌋";
          color = "#ff4400";
          break;
        case ElementType.ICEBERG:
          icon = "🧊";
          color = "#000088";
          break;
        case ElementType.STORM:
          icon = "🌪️";
          color = "#ffff00";
          break;
        case ElementType.MELTDOWN:
          icon = "🫠";
          color = "#aaffaa";
          break;
        case ElementType.PARALYSIS:
          icon = "🤢";
          color = "#aaff00";
          break;
        case ElementType.FREEZE_SHOCK:
          icon = "🥶";
          color = "#00ccff";
          break;
        case ElementType.HOLY_SWORD:
          icon = "✝️";
          color = "#ffff88";
          break;
        case ElementType.DUAL_SHIELD:
          icon = "🛡️";
          color = "#4444ff";
          break;
        case ElementType.DUAL_SHIELD:
          icon = "🛡️";
          color = "#4444ff";
          break;
        case ElementType.PHYSICAL:
          icon = "👊";
          color = "#ffffff";
          break;
        case ElementType.ARCANE:
          icon = "🔮";
          color = "#aa00aa";
          break;
        case ElementType.TECH:
          icon = "🔧";
          color = "#00ff00";
          break;
        case ElementType.LIGHT:
          icon = "✨";
          color = "#ffffaa";
          break;
        case ElementType.BLOOD:
          icon = "🩸";
          color = "#ff0000";
          break;
        case ElementType.GRAVITY:
          icon = "🌑";
          color = "#220022";
          break;
        default:
          icon = "❓";
          color = "#ccc";
          break;
      }
      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      ctx.lineWidth = 2;

      // Tier Visuals
      if (this.tier >= 3) {
        // Unique (Gold/Purple)
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 15;
      } else if (this.tier === 2) {
        // Rare (Cyan/Silver)
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 10;
      } else {
        // Normal (White)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
      }

      ctx.stroke();

      ctx.font = `${size * 1.8}px "Segoe UI Emoji", Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(icon, x, y + 1);

      ctx.restore();
    },
  };
};
