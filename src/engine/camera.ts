import { Vector2D } from "../game/types";
import { getPlayer } from "../game/gameState";
import * as CONFIG from "../game/constants";

let cameraX = 0;
let cameraY = 0;

export const updateCamera = () => {
  const player = getPlayer();
  if (!player) return;

  // Smooth camera follow
  const targetX = player.position.x;
  const targetY = player.position.y;

  cameraX += (targetX - cameraX) * CONFIG.CAMERA_SMOOTHING;
  cameraY += (targetY - cameraY) * CONFIG.CAMERA_SMOOTHING;
};

export const getCameraPosition = (): Vector2D => {
  return { x: cameraX, y: cameraY };
};

export const applyCamera = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
  ctx.save();
  ctx.translate(-cameraX + canvasWidth / 2, -cameraY + canvasHeight / 2);
};

export const resetCamera = (ctx: CanvasRenderingContext2D) => {
  ctx.restore();
};
