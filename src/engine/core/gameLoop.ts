import { updateGameState, drawGameState, getPlayer, getEnemies, getCollectibles } from "@/game/managers/state";
import { updateInput, getIsPaused } from "@/engine/systems/input";
import { spawnRandomCollectible } from "@/game/entities/collectible";
import { updateCamera, applyCamera, resetCamera, getCameraPosition } from "@/engine/systems/camera";
import { waveManager } from "@/game/managers/waveManager";
import { checkTailMerges } from "@/game/systems/merge";
import { updateCombat } from "@/game/systems/combat";
import { updateWeapons } from "@/game/systems/weaponSystem";
import * as CONFIG from "@/game/config/constants";

let isRunning = false;
let lastTime = 0;
let canvasContext: CanvasRenderingContext2D | null = null;
let animationFrameId: number | null = null;

// Game Loop Function
const loop = (timestamp: number) => {
  if (!isRunning || !canvasContext) return;

  let deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Cap deltaTime to prevent huge jumps (lag)
  if (deltaTime > CONFIG.MAX_DELTA_TIME) deltaTime = CONFIG.MAX_DELTA_TIME;
  // Ensure deltaTime is never 0 or negative
  if (deltaTime <= 0) deltaTime = CONFIG.MIN_DELTA_TIME;

  // Check pause state
  const paused = getIsPaused();

  // Always render, but only update game logic if not paused
  if (!paused) {
    // 1. Spawn Collectibles (플레이어 주변에만 스폰)
    if (Math.random() < CONFIG.COLLECTIBLE_SPAWN_CHANCE) {
      const player = getPlayer();
      if (player) {
        // 플레이어 주변 일정 범위 내에서 랜덤 스폰 (미니맵에 보이는 범위)
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * CONFIG.COLLECTIBLE_SPAWN_RANGE;

        const x = player.position.x + Math.cos(angle) * distance;
        const y = player.position.y + Math.sin(angle) * distance;

        // 맵 경계 체크 (무한 맵이지만 최대 크기는 있음)
        if (x >= 0 && x <= CONFIG.WORLD_WIDTH && y >= 0 && y <= CONFIG.WORLD_HEIGHT) {
          spawnRandomCollectible(x, y);
        }
      }
    }

    // 2. Spawn Enemies (Managed by WaveManager)
    waveManager.update(deltaTime);

    // 3. Update Game Logic
    updateGameState(deltaTime);
    checkTailMerges();
    const player = getPlayer();
    if (player) updateWeapons(player, deltaTime);
    updateCombat(deltaTime);
    updateCamera();

    updateInput();
  }

  render(canvasContext);

  animationFrameId = requestAnimationFrame(loop);
};

const render = (ctx: CanvasRenderingContext2D) => {
  // Clear Screen
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Reset ALL canvas states before starting
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

  // Draw Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // === WORLD SPACE (with camera) ===
  applyCamera(ctx, ctx.canvas.width, ctx.canvas.height);

  // Draw Grid
  drawGrid(ctx);

  // Reset states after grid
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  // Draw World Bounds
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);

  // Reset states before drawing entities
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw Game Entities
  drawGameState(ctx);

  resetCamera(ctx);

  // Reset states after camera reset
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // === SCREEN SPACE (UI) ===
  drawUI(ctx);

  // Pause Menu is now handled by React Overlay (GameUI) so we don't draw it on canvas anymore
};

const drawGrid = (ctx: CanvasRenderingContext2D) => {
  ctx.save();
  const cam = getCameraPosition();

  const startX = Math.floor((cam.x - ctx.canvas.width / 2) / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  const endX = Math.ceil((cam.x + ctx.canvas.width / 2) / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  const startY = Math.floor((cam.y - ctx.canvas.height / 2) / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;
  const endY = Math.ceil((cam.y + ctx.canvas.height / 2) / CONFIG.GRID_SIZE) * CONFIG.GRID_SIZE;

  ctx.strokeStyle = CONFIG.GRID_COLOR;
  ctx.lineWidth = CONFIG.GRID_LINE_WIDTH;

  // 무한 맵 느낌을 위해 경계 체크 제거
  for (let x = startX; x <= endX; x += CONFIG.GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y += CONFIG.GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }
  ctx.restore();
};

const drawUI = (ctx: CanvasRenderingContext2D) => {
  // Only draw minimap (score and pause button are now React components)
  drawMinimap(ctx);
};

const drawMinimap = (ctx: CanvasRenderingContext2D) => {
  ctx.save();
  const player = getPlayer();
  if (!player) {
    ctx.restore();
    return;
  }

  const { x: px, y: py } = player.position;

  // 반응형 미니맵 크기 설정
  // Tablet(iPad) 등은 PC와 같은 크기(150) 사용, 작은 모바일만 축소(100)
  const isMobile = window.innerWidth <= 600;
  const size = isMobile ? CONFIG.MOBILE_MINIMAP_SIZE : CONFIG.MINIMAP_SIZE;
  const margin = isMobile ? 8 : CONFIG.MINIMAP_MARGIN;

  // Top-right corner (score moved to left)
  const x = ctx.canvas.width - size - margin;
  const y = margin;

  // 미니맵 배경 (Glassmorphism effect)
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  // Decorative border corners or glow could be added here
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  // Top left corner
  ctx.beginPath();
  ctx.moveTo(x, y + 15);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 15, y);
  ctx.stroke();
  // Bottom right corner
  ctx.beginPath();
  ctx.moveTo(x + size - 15, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size, y + size - 15);
  ctx.stroke();

  // 로컬 범위 (플레이어 주변 영역만 표시)
  const localRange = CONFIG.MINIMAP_VISIBLE_RANGE;
  const scale = size / localRange;

  // 플레이어 (중앙)
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // 적들 (플레이어 기준 상대 위치)
  ctx.fillStyle = "#f00";
  getEnemies().forEach(enemy => {
    const relX = enemy.position.x - px;
    const relY = enemy.position.y - py;

    // 로컬 범위 내에 있는 것만 표시
    if (Math.abs(relX) < localRange / 2 && Math.abs(relY) < localRange / 2) {
      const mx = x + size / 2 + relX * scale;
      const my = y + size / 2 + relY * scale;
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 아이템들 (플레이어 기준 상대 위치)
  ctx.fillStyle = "#0f0";
  getCollectibles().forEach(collectible => {
    const relX = collectible.position.x - px;
    const relY = collectible.position.y - py;

    // 로컬 범위 내에 있는 것만 표시
    if (Math.abs(relX) < localRange / 2 && Math.abs(relY) < localRange / 2) {
      const mx = x + size / 2 + relX * scale;
      const my = y + size / 2 + relY * scale;
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
};

export const startGame = (ctx: CanvasRenderingContext2D) => {
  if (isRunning) return;

  canvasContext = ctx;
  isRunning = true;
  lastTime = performance.now();
  loop(lastTime);
};

export const stopGame = () => {
  isRunning = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
};
