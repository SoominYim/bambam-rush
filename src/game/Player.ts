import { GameObject, Vector2D } from "../types";
import { InputManager } from "../engine/InputManager";

export class Player implements GameObject {
  id: string = "player";
  position: Vector2D;
  speed: number = 300;
  radius: number = 20;

  constructor(startX: number, startY: number) {
    this.position = { x: startX, y: startY };
  }

  update(deltaTime: number) {
    const input = InputManager.getInstance();
    const moveDir = { x: 0, y: 0 };

    if (input.isKeyDown("KeyW") || input.isKeyDown("ArrowUp")) moveDir.y -= 1;
    if (input.isKeyDown("KeyS") || input.isKeyDown("ArrowDown")) moveDir.y += 1;
    if (input.isKeyDown("KeyA") || input.isKeyDown("ArrowLeft")) moveDir.x -= 1;
    if (input.isKeyDown("KeyD") || input.isKeyDown("ArrowRight")) moveDir.x += 1;

    // Normalize vector
    if (moveDir.x !== 0 || moveDir.y !== 0) {
      const length = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y);
      moveDir.x /= length;
      moveDir.y /= length;
    }

    this.position.x += moveDir.x * this.speed * deltaTime;
    this.position.y += moveDir.y * this.speed * deltaTime;

    // Boundary check (optional, implement later)
    this.position.x = Math.max(this.radius, Math.min(window.innerWidth - this.radius, this.position.x));
    this.position.y = Math.max(this.radius, Math.min(window.innerHeight - this.radius, this.position.y));
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#4a90e2"; // Blue player
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw direction indicator
    const input = InputManager.getInstance();
    const mouse = input.getMousePosition();
    const angle = Math.atan2(mouse.y - this.position.y, mouse.x - this.position.x);

    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(
      this.position.x + Math.cos(angle) * (this.radius + 15),
      this.position.y + Math.sin(angle) * (this.radius + 15),
    );
    ctx.strokeStyle = "#ffcc00";
    ctx.stroke();
  }
}
