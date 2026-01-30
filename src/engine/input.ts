import { Vector2D } from "../game/types";

// Input State
let keyState: Set<string> = new Set();
let keysPressedThisFrame: Set<string> = new Set();
let mousePosition: Vector2D = { x: 0, y: 0 };
let mouseButtons: Set<number> = new Set();
let mouseButtonsPressedThisFrame: Set<number> = new Set();
let isPaused = false;

export const initInput = () => {
  window.addEventListener("contextmenu", e => e.preventDefault());

  window.addEventListener("keydown", e => {
    if (!keyState.has(e.code)) {
      keysPressedThisFrame.add(e.code);
    }
    keyState.add(e.code);
  });

  window.addEventListener("keyup", e => keyState.delete(e.code));

  window.addEventListener("mousemove", e => {
    mousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("mousedown", e => {
    if (!mouseButtons.has(e.button)) {
      mouseButtonsPressedThisFrame.add(e.button);
    }
    mouseButtons.add(e.button);
  });

  window.addEventListener("mouseup", e => mouseButtons.delete(e.button));
};

export const updateInput = () => {
  keysPressedThisFrame.clear();
  mouseButtonsPressedThisFrame.clear();
};

export const isKeyDown = (code: string): boolean => {
  return keyState.has(code);
};

export const isKeyPressed = (code: string): boolean => {
  return keysPressedThisFrame.has(code);
};

export const getMousePosition = (): Vector2D => {
  return mousePosition;
};

export const isRightMouseDown = (): boolean => {
  return mouseButtons.has(2);
};

export const getIsPaused = (): boolean => {
  return isPaused;
};

export const setPaused = (paused: boolean): void => {
  isPaused = paused;
};
