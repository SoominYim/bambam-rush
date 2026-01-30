import { InputManager } from "./InputManager";
import { EntityManager } from "../game/EntityManager";

export class GameLoop {
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;

  constructor() {}

  public setContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const deltaTime = (timestamp - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number) {
    // InputManager is constantly updating via event listeners, but we might want to poll or process input here
    EntityManager.getInstance().update(deltaTime);
  }

  private draw() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Draw background (simple fill for now)
    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Draw all entities
    EntityManager.getInstance().draw(this.ctx);

    // Debug info (optional)
    // this.ctx.fillStyle = 'white';
    // this.ctx.font = '12px Arial';
    // this.ctx.fillText(`Entities: ${EntityManager.getInstance().getEntities().length}`, 10, 20);
  }
}

export const gameLoop = new GameLoop();
