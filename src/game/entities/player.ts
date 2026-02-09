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
import * as CONFIG from "../config/constants";
import { drawCharacter } from "@/game/utils/characterRenderer";
import { getWeaponIconImage } from "@/game/utils/IconCache";

// Position history for snake-like trailing (Breadcrumb system)
let positionHistory: Vector2D[] = [];
const HISTORY_SPACING = 2; // Resolution of path tracking
const MAX_HISTORY = 5000;

export const getPositionHistory = () => positionHistory;
export const resetPositionHistory = () => {
  positionHistory = [];
};

import { ELEMENT_STYLES } from "@/game/config/elementStyles";
import { CHARACTER_REGISTRY } from "@/game/config/characterRegistry";

export const createPlayer = (startX: Scalar, startY: Scalar, characterId: string = "BASIC"): Player => {
  positionHistory = [{ x: startX, y: startY }];

  const charDef = CHARACTER_REGISTRY[characterId] || CHARACTER_REGISTRY.BASIC;

  const stats: PlayerStats = {
    ...charDef.baseStats!,
    // Ensure all required fields exist (fallback)
    hp: charDef.baseStats?.hp || CONFIG.PLAYER_BASE_HP,
    maxHp: charDef.baseStats?.maxHp || CONFIG.PLAYER_BASE_HP,
    atk: charDef.baseStats?.atk || CONFIG.PLAYER_BASE_ATK,
    def: charDef.baseStats?.def || CONFIG.PLAYER_BASE_DEF,
    fireRate: charDef.baseStats?.fireRate || CONFIG.PLAYER_BASE_FIRE_RATE,
    moveSpeed: charDef.baseStats?.moveSpeed || 1.0,
    projectileSpeed: charDef.baseStats?.projectileSpeed || 1.0,
    duration: charDef.baseStats?.duration || 1.0,
    area: charDef.baseStats?.area || 1.0,
    cooldown: charDef.baseStats?.cooldown || 0,
    amount: charDef.baseStats?.amount || 0,
    luck: charDef.baseStats?.luck || 1.0,
    revival: charDef.baseStats?.revival || 0,
    xp: 0,
    maxXp: 100,
    level: 1,
    gold: 0,
    pickupRange: charDef.baseStats?.pickupRange || 60,
    hpRegen: 0.5,
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
      const speedMult = this.stats.moveSpeed || 1.0;

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
      if (positionHistory.length > 0) {
        let lastPoint = positionHistory[0];
        let dist = Math.sqrt((this.position.x - lastPoint.x) ** 2 + (this.position.y - lastPoint.y) ** 2);

        // If moved more than the spacing, fill the gap with breadcrumbs
        // This prevents the tail from "stretching" or lagging at high speeds
        while (dist >= HISTORY_SPACING) {
          const angle = Math.atan2(this.position.y - lastPoint.y, this.position.x - lastPoint.x);
          const nextPoint = {
            x: lastPoint.x + Math.cos(angle) * HISTORY_SPACING,
            y: lastPoint.y + Math.sin(angle) * HISTORY_SPACING,
          };

          positionHistory.unshift(nextPoint);
          if (positionHistory.length > MAX_HISTORY) {
            positionHistory.pop();
          }

          lastPoint = nextPoint;
          dist = Math.sqrt((this.position.x - lastPoint.x) ** 2 + (this.position.y - lastPoint.y) ** 2);
        }
      } else {
        positionHistory.unshift({ x: this.position.x, y: this.position.y });
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

      if (myIndexInTail === -1 || history.length < 2) return;

      // Distance from Head to history[0]
      const player = getPlayer();
      if (!player) return;

      const dx = player.position.x - history[0].x;
      const dy = player.position.y - history[0].y;
      const distToHistoryZero = Math.sqrt(dx * dx + dy * dy);

      // 1. Calculate Target Distance along the path (in pixels)
      const targetDistFromHead = CONFIG.SNAKE_HEAD_GAP + myIndexInTail * CONFIG.SNAKE_SEGMENT_SPACING;

      // 2. Convert Distance to FloatIndex in history array
      // floatIndex = (targetDist - currentHeadToHistoryDist) / spacing
      const floatIndex = (targetDistFromHead - distToHistoryZero) / HISTORY_SPACING;

      // 3. Sub-pixel Path Interpolation
      if (floatIndex >= 0 && floatIndex < history.length - 1) {
        const i0 = Math.floor(floatIndex);
        const i1 = i0 + 1;
        const remainder = floatIndex - i0;

        const p0 = history[i0];
        const p1 = history[i1];

        this.position.x = p0.x + (p1.x - p0.x) * remainder;
        this.position.y = p0.y + (p1.y - p0.y) * remainder;
      } else if (floatIndex < 0) {
        // Between Head and history[0]
        const t = targetDistFromHead / (distToHistoryZero || 1);
        this.position.x = player.position.x + (history[0].x - player.position.x) * t;
        this.position.y = player.position.y + (history[0].y - player.position.y) * t;
      } else {
        const last = history[history.length - 1];
        this.position.x = last.x;
        this.position.y = last.y;
      }

      // Update Level Up effect timer
      if (this.levelUpTimer && this.levelUpTimer > 0) {
        this.levelUpTimer -= _deltaTime;
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Scale tail segment to match Main Character Size but slightly smaller
      const size = CONFIG.PLAYER_RADIUS * 0.85; // 85% of player size
      const x = this.position.x;
      const y = this.position.y;

      const style = ELEMENT_STYLES[this.type] || ELEMENT_STYLES.DEFAULT;
      const color = style.color;

      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 3. Level/Tier Visuals (Border & Glow)
      // Determine level (from weapon system if available, else fallback to tier)
      let level = this.tier;
      const playerObj = getPlayer();
      if (this.weaponId && playerObj) {
        const weapon = playerObj.activeWeapons.find(w => w.id === this.weaponId);
        if (weapon) level = weapon.level;
      }

      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);

      let strokeColor = "#ffffff";
      let shadowColor = "transparent";
      let lineWidth = 2;
      let shadowBlur = 0;

      // Rainbow Border System (1: Red, 2: Orange, 3: Yellow, 4: Green, 5: Blue, 6: Indigo, 7: Violet, 8: Rainbow)
      if (level >= 8) {
        // Level 8: Animated Rainbow!
        const hue = (Date.now() / 10) % 360;
        strokeColor = `hsl(${hue}, 100%, 50%)`;
        shadowColor = `hsl(${hue}, 100%, 60%)`;
        lineWidth = CONFIG.SNAKE_SEGMENT_BORDER_MAX;
        shadowBlur = 15;
      } else if (level >= 1 && level <= 7) {
        strokeColor = CONFIG.SNAKE_SEGMENT_LEVEL_COLORS[level - 1];
        shadowColor = strokeColor;
        lineWidth = CONFIG.SNAKE_SEGMENT_BORDER_BASE;
        shadowBlur = 5 + level;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.stroke();

      // Reset shadow for icon
      ctx.shadowBlur = 0;

      // Try drawing SVG Icon (only if weapon is assigned)
      const svgImg = this.weaponId ? getWeaponIconImage(this.weaponId) : null;
      if (svgImg) {
        // 비율 유지하며 크기 최대화
        const maxIconSize = size * 2.5;
        let drawW = maxIconSize;
        let drawH = maxIconSize;

        if (svgImg.naturalWidth > 0 && svgImg.naturalHeight > 0) {
          const ratio = svgImg.naturalWidth / svgImg.naturalHeight;
          if (ratio > 1) {
            drawH = maxIconSize / ratio;
          } else {
            drawW = maxIconSize * ratio;
          }
        }

        // Draw Image centered
        ctx.drawImage(svgImg, x - drawW / 2, y - drawH / 2, drawW, drawH);
      }
      // No fallback emoji - just show colored circle if no weapon assigned

      // 4. Level Up Visual Effect (Floating Text)
      if (this.levelUpTimer && this.levelUpTimer > 0) {
        const progress = 1.0 - this.levelUpTimer / 1.5; // 1.5s duration
        const offsetY = -30 - progress * 12; // Lower start, more grounded float
        const alpha = Math.min(1.0, this.levelUpTimer * 2.5); // Faster fade in/out

        ctx.globalAlpha = alpha;
        ctx.textAlign = "center";

        // 1. Render LEVEL UP! Header
        ctx.font = `bold 13px "Segoe UI", Arial, sans-serif`;
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillText("LEVEL UP!", x + 1, y + offsetY + 1);
        // Rainbow effect
        const hue = (Date.now() / 6) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 75%)`;
        ctx.fillText("LEVEL UP!", x, y + offsetY);

        // 2. Render Description (Enforced fallback only if registry is truly broken)
        const desc = this.levelUpDescription || "UPGRADE";
        ctx.font = `bold 10px "Segoe UI", Arial, sans-serif`;
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillText(desc, x + 1, y + offsetY + 15 + 1);
        // Bright contrast color
        ctx.fillStyle = "#ffff00"; // Bright Yellow for upgrades
        ctx.fillText(desc, x, y + offsetY + 15);

        ctx.globalAlpha = 1.0;
      }

      ctx.restore();
    },
  };
};
