import { Vector2D } from "@/game/types";

// Input State
let keyState: Set<string> = new Set();
let keysPressedThisFrame: Set<string> = new Set();
let mousePosition: Vector2D = { x: 0, y: 0 };
let mouseButtons: Set<number> = new Set();
let mouseButtonsPressedThisFrame: Set<number> = new Set();
let isPaused = false;

// 가상 조이스틱 지원
let joystickDirection = { x: 0, y: 0 };

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

export const getMovementDirection = (): { x: number; y: number } => {
  let x = 0;
  let y = 0;

  // 조이스틱 입력이 있으면 조이스틱만 사용 (우선순위)
  // 데드존을 줄여서 더 민감하게 반응
  if (Math.abs(joystickDirection.x) > 0.05 || Math.abs(joystickDirection.y) > 0.05) {
    return joystickDirection; // 조이스틱 값은 이미 정규화됨
  }

  // 키보드 입력
  if (keyState.has("KeyW") || keyState.has("ArrowUp")) y -= 1;
  if (keyState.has("KeyS") || keyState.has("ArrowDown")) y += 1;
  if (keyState.has("KeyA") || keyState.has("ArrowLeft")) x -= 1;
  if (keyState.has("KeyD") || keyState.has("ArrowRight")) x += 1;

  // 정규화
  const length = Math.sqrt(x * x + y * y);
  if (length > 0) {
    x /= length;
    y /= length;
  }

  return { x, y };
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

// 가상 조이스틱 방향 설정 (React 컴포넌트에서 호출)
export const setJoystickDirection = (x: number, y: number): void => {
  joystickDirection = { x, y };
};
