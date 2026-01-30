import { Vector2D, TailSegment, Scalar, ElementType, GameObject, Player, PlayerStats } from "@/game/types";
import { getMovementDirection } from "@/engine/systems/input";
import { getTail, addTailSegment, getCollectibles, addScore, getPlayer } from "@/game/managers/state";
import { VFXFactory } from "@/engine/vfx/VFXFactory";
import * as CONFIG from "../config/constants";

// Position history for snake-like trailing
let positionHistory: Vector2D[] = [];
const HISTORY_SPACING = 5;
const MAX_HISTORY = 1000;

export const getPositionHistory = () => positionHistory;
export const resetPositionHistory = () => {
  positionHistory = [];
};

export const createPlayer = (startX: Scalar, startY: Scalar): Player => {
  positionHistory = [{ x: startX, y: startY }];

  const stats: PlayerStats = {
    hp: CONFIG.PLAYER_BASE_HP,
    maxHp: CONFIG.PLAYER_BASE_HP,
    atk: CONFIG.PLAYER_BASE_ATK,
    def: CONFIG.PLAYER_BASE_DEF,
    fireRate: CONFIG.PLAYER_BASE_FIRE_RATE,
  };

  const player: Player = {
    id: "snake_head",
    position: { x: startX, y: startY },
    stats: stats,

    update: function (deltaTime: Scalar) {
      const moveDir = getMovementDirection();
      const prevX = this.position.x;
      const prevY = this.position.y;

      this.position.x += moveDir.x * CONFIG.PLAYER_SPEED * deltaTime;
      this.position.y += moveDir.y * CONFIG.PLAYER_SPEED * deltaTime;

      // 1. Boundary Collision
      this.position.x = Math.max(
        CONFIG.PLAYER_RADIUS,
        Math.min(CONFIG.WORLD_WIDTH - CONFIG.PLAYER_RADIUS, this.position.x),
      );
      this.position.y = Math.max(
        CONFIG.PLAYER_RADIUS,
        Math.min(CONFIG.WORLD_HEIGHT - CONFIG.PLAYER_RADIUS, this.position.y),
      );

      // 2. Record position history
      const dx = this.position.x - prevX;
      const dy = this.position.y - prevY;
      const moved = Math.sqrt(dx * dx + dy * dy);

      if (moved > HISTORY_SPACING) {
        positionHistory.unshift({ x: this.position.x, y: this.position.y });
        if (positionHistory.length > MAX_HISTORY) {
          positionHistory.pop();
        }
      }

      checkCollection(this);
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, CONFIG.PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(this.position.x - 7, this.position.y - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.position.x + 7, this.position.y - 5, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
  };

  return player;
};

const checkCollection = (head: GameObject) => {
  const collectibles = getCollectibles();
  const tail = getTail();

  collectibles.forEach(c => {
    if (c.isExpired) return;

    const dx = head.position.x - c.position.x;
    const dy = head.position.y - c.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CONFIG.COLLECTION_RADIUS) {
      c.isExpired = true;
      addScore(CONFIG.COLLECTION_SCORE);
      const newSegment = createTailSegment(tail.length, c.type);
      addTailSegment(newSegment);
    }
  });
};

const createTailSegment = (index: number, elementType: ElementType): TailSegment => {
  const pointsPerSegment = Math.floor(CONFIG.SNAKE_SEGMENT_SPACING / HISTORY_SPACING);
  const historyIndex = (index + 1) * pointsPerSegment;

  const history = getPositionHistory();
  const player = getPlayer();

  let startPos: Vector2D;
  if (historyIndex < history.length && history[historyIndex]) {
    startPos = history[historyIndex];
  } else if (player) {
    startPos = { x: player.position.x, y: player.position.y };
  } else {
    startPos = { x: 500, y: 500 };
  }

  return {
    id: `tail_${Date.now()}_${Math.random()}`,
    position: { x: startPos.x, y: startPos.y },
    type: elementType,
    tier: 1,
    followTarget: null,

    update: function (deltaTime: Scalar) {
      const tail = getTail();
      const myIndex = tail.indexOf(this);
      if (myIndex === -1) return;

      let targetPos: Vector2D;
      if (myIndex === 0) {
        const player = getPlayer();
        if (!player) return;
        targetPos = player.position;
      } else {
        targetPos = tail[myIndex - 1].position;
      }

      const dx = targetPos.x - this.position.x;
      const dy = targetPos.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Add aura particles
      if (Math.random() < 0.05) {
        VFXFactory.createTrail(this.position.x, this.position.y, this.type);
      }

      const desiredDistance = CONFIG.SNAKE_SEGMENT_SPACING;
      if (distance > desiredDistance) {
        const moveDistance = Math.min(distance - desiredDistance, CONFIG.PLAYER_SPEED * deltaTime);
        const ratio = moveDistance / distance;
        this.position.x += dx * ratio;
        this.position.y += dy * ratio;
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
      }

      const size = CONFIG.SNAKE_SEGMENT_RADIUS + (this.tier - 1) * 2;
      const x = Math.round(this.position.x);
      const y = Math.round(this.position.y);

      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
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
