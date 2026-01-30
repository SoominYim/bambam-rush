import { Vector2D } from "../types";

export class InputManager {
  private static instance: InputManager;
  private keys: Set<string> = new Set();
  private mousePosition: Vector2D = { x: 0, y: 0 };
  private mouseButtons: Set<number> = new Set();

  // Quick spell queue for combo detection
  private spellInputs: { type: string; time: number }[] = [];

  private constructor() {
    this.init();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private init() {
    window.addEventListener("keydown", e => this.keys.add(e.code));
    window.addEventListener("keyup", e => this.keys.delete(e.code));

    window.addEventListener("mousemove", e => {
      this.mousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mousedown", e => this.mouseButtons.add(e.button));
    window.addEventListener("mouseup", e => this.mouseButtons.delete(e.button));
  }

  public isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  public getMousePosition(): Vector2D {
    return this.mousePosition;
  }

  public isMouseButtonDown(button: number): boolean {
    return this.mouseButtons.has(button);
  }
}
