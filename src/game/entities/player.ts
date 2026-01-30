import { GameObject, Vector2D, Scalar } from "../types";
import { isKeyDown } from "../../engine/input";
import { getTail, addTailSegment, getCollectibles, addScore } from "../gameState";
import { TailSegment, ElementType } from "../types";
import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  SNAKE_SEGMENT_SPACING,
  SNAKE_SEGMENT_RADIUS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  COLLECTION_RADIUS,
  COLLECTION_SCORE,
} from "../constants";

// Position history for snake-like trailing
const positionHistory: Vector2D[] = [];
const HISTORY_SPACING = 5; // 히스토리 기록 간격
const MAX_HISTORY = 1000; // 최대 히스토리 길이

export const createPlayer = (startX: Scalar, startY: Scalar): GameObject => {
  const player: GameObject = {
    id: "snake_head",
    position: { x: startX, y: startY },

    update: function (deltaTime: Scalar) {
      // 1. WASD Movement
      const moveDir = { x: 0, y: 0 };
      if (isKeyDown("KeyW") || isKeyDown("ArrowUp")) moveDir.y -= 1;
      if (isKeyDown("KeyS") || isKeyDown("ArrowDown")) moveDir.y += 1;
      if (isKeyDown("KeyA") || isKeyDown("ArrowLeft")) moveDir.x -= 1;
      if (isKeyDown("KeyD") || isKeyDown("ArrowRight")) moveDir.x += 1;

      if (moveDir.x !== 0 || moveDir.y !== 0) {
        const length = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y);
        moveDir.x /= length;
        moveDir.y /= length;
      }

      const prevX = this.position.x;
      const prevY = this.position.y;

      this.position.x += moveDir.x * PLAYER_SPEED * deltaTime;
      this.position.y += moveDir.y * PLAYER_SPEED * deltaTime;

      // 1. Boundary Collision
      this.position.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_WIDTH - PLAYER_RADIUS, this.position.x));
      this.position.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_HEIGHT - PLAYER_RADIUS, this.position.y));

      // 2. Record position history for snake segments
      const dx = this.position.x - prevX;
      const dy = this.position.y - prevY;
      const moved = Math.sqrt(dx * dx + dy * dy);

      if (moved > HISTORY_SPACING) {
        positionHistory.unshift({ x: this.position.x, y: this.position.y });

        // Keep history length reasonable (cap at 1000 points)
        if (positionHistory.length > MAX_HISTORY) {
          positionHistory.pop();
        }
      }

      // 3. Collection Check
      checkCollection(this);
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      // Draw Head
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Eyes
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(this.position.x - 7, this.position.y - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.position.x + 7, this.position.y - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    },
  };

  return player;
};

export const getPositionHistory = () => positionHistory;

const checkCollection = (head: GameObject) => {
  const collectibles = getCollectibles();
  const tail = getTail();

  collectibles.forEach(c => {
    if (c.isExpired) return;

    const dx = head.position.x - c.position.x;
    const dy = head.position.y - c.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 40) {
      c.isExpired = true;
      addScore(10); // 이제 정상적으로 import된 함수 사용

      const newSegment = createTailSegment(tail.length, c.type);
      addTailSegment(newSegment);
    }
  });
};

const createTailSegment = (index: number, elementType: ElementType): TailSegment => {
  const pointsPerSegment = Math.floor(CONFIG.SNAKE_SEGMENT_SPACING / HISTORY_SPACING);
  const historyIndex = (index + 1) * pointsPerSegment;

  const history = getPositionHistory();
  const startPos = history[Math.min(historyIndex, history.length - 1)] || { x: 0, y: 0 };

  return {
    id: `tail_${Date.now()}_${Math.random()}`,
    position: { x: startPos.x, y: startPos.y },
    type: elementType,
    tier: 1,
    followTarget: null,

    update: function (deltaTime: Scalar) {
      // Follow the position history
      const history = getPositionHistory();
      const tail = getTail();
      const myIndex = tail.indexOf(this);

      if (myIndex === -1) return;

      const pointsPerSegment = Math.floor(CONFIG.SNAKE_SEGMENT_SPACING / HISTORY_SPACING);
      const targetHistoryIndex = (myIndex + 1) * pointsPerSegment;

      if (targetHistoryIndex < history.length) {
        this.position.x = history[targetHistoryIndex].x;
        this.position.y = history[targetHistoryIndex].y;
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      let color = "#ccc";
      switch (this.type) {
        case ElementType.FIRE:
          color = "#ff4400";
          break;
        case ElementType.WATER:
          color = "#0088ff";
          break;
        case ElementType.ICE:
          color = "#00ffff";
          break;
        case ElementType.WIND:
          color = "#ccffcc";
          break;

        case ElementType.STEAM:
          color = "#dddddd";
          break;
        case ElementType.LAVA:
          color = "#880000";
          break;
        case ElementType.INFERNO:
          color = "#ff00ff";
          break;
        case ElementType.ICEBERG:
          color = "#000088";
          break;
        case ElementType.STORM:
          color = "#ffff00";
          break;
        case ElementType.BLIZZARD:
          color = "#aaddff";
          break;
      }

      const size = CONFIG.SNAKE_SEGMENT_RADIUS + (this.tier - 1) * 5;

      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  };
};
