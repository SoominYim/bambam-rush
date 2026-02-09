import { Projectile } from "@/game/types";
import { getPlayer, getEnemies, getTail } from "@/game/managers/state";
import { addArea } from "@/game/managers/entityStore"; // Fix circular dependency
import { createArea } from "@/game/entities/area";
import { VFXFactory } from "@/engine/vfx/VFXFactory";

/**
 * Projectile 행동 타입
 */
export type ProjectileBehavior =
  | "NORMAL"
  | "ORBIT"
  | "RETURN"
  | "BOUNCE"
  | "ARC"
  | "LINEAR"
  | "SWING"
  | "STAB"
  | "ORBIT_STAB"
  | "HOMING"
  | "BOTTLE";

/**
 * 행동 함수 타입
 */
type BehaviorFunction = (proj: Projectile, dt: number) => void;

/**
 * NORMAL - 기본 직선 이동
 */
const updateNormal: BehaviorFunction = (proj, dt) => {
  const speed = (proj as any).speed || 200;
  const angle = proj.angle ?? 0;
  proj.position.x += Math.cos(angle) * speed * dt;
  proj.position.y += Math.sin(angle) * speed * dt;
};

/**
 * ORBIT - Guardian Pattern (Idle Orbit <-> Aggressive Orbit)
 */
const updateOrbit: BehaviorFunction = (proj, dt) => {
  const p = proj as any;

  // 1. Owner & Center Resolution
  let center = { x: 0, y: 0 };

  // Persistent Owner Logic (Priority)
  if (p.parentID) {
    // Dynamic owner lookup
    let owner = null;
    if (p.parentID === "snake_head") {
      owner = getPlayer();
    } else {
      const tails = getTail() as any[];
      owner = tails.find((t: any) => t.id === p.parentID);
    }

    if (owner) {
      center = { x: owner.position.x, y: owner.position.y };
      p.missingOwnerTime = 0;
    } else {
      // Owner lost - Grace period
      p.missingOwnerTime = (p.missingOwnerTime || 0) + dt;
      if (p.missingOwnerTime > 0.5) {
        proj.isExpired = true;
        return;
      }
      // Use last known pos or self pos during grace
      center = { x: proj.position.x, y: proj.position.y };
    }
  } else if (p.orbitCenter) {
    // Static center fallback
    center = p.orbitCenter;
  } else {
    // Player fallback
    const player = getPlayer();
    if (player) {
      center = player.position;
    }
  }

  // 2. State & Target Logic
  // Only run logic if we have valid props for Guardian mode
  if (p.triggerRange) {
    // Find Target
    const enemies = getEnemies() as any[];
    let nearest = null;
    let minD = p.triggerRange * p.triggerRange;

    // Optimization: Check nearest only
    for (const e of enemies) {
      if (e.isExpired) continue;
      const dx = e.position.x - center.x;
      const dy = e.position.y - center.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minD) {
        minD = dSq;
        nearest = e;
      }
    }

    // State Transition
    if (nearest) {
      p.orbitState = "ATTACK";
    } else {
      p.orbitState = "IDLE";
    }

    // Target Radius calculation
    const targetRadius = p.orbitState === "ATTACK" ? p.orbitRadiusMax || 120 : p.orbitRadiusBase || 50;

    // Lerp Radius (Smooth transition)
    const lerpSpeed = 5.0;
    p.currentOrbitRadius = p.currentOrbitRadius || p.orbitRadiusBase || 50;
    p.currentOrbitRadius += (targetRadius - p.currentOrbitRadius) * lerpSpeed * dt;

    // Target Speed calculation
    const targetSpeed = p.orbitState === "ATTACK" ? p.orbitSpeedAggro || 3.0 : p.orbitSpeedBase || 1.5;

    // Lerp Speed (Optional, simpler to just set)
    p.currentOrbitSpeed = p.currentOrbitSpeed || targetSpeed;
    p.currentOrbitSpeed += (targetSpeed - p.currentOrbitSpeed) * 2.0 * dt;
  } else {
    // Standard Orbit Fallback
    let baseRadius = p.orbitRadiusBase !== undefined ? p.orbitRadiusBase : 60;

    // MAX 레벨(8) 특수 효과: 반경 진동 (바깥쪽으로만 확장)
    if (p.currentLevel >= 8) {
      const pulseSpeed = 4.0; // 진동 속도
      const pulseAmount = 60; // 0 ~ 60 추가 (40 ~ 100 범위)
      const timeSec = Date.now() / 1000;
      // -1~1 -> 0~1 변환하여 기본 반경에 더함 (안쪽으로 침범 X)
      const pulse01 = (Math.sin(timeSec * pulseSpeed) + 1) * 0.5;
      baseRadius += pulse01 * pulseAmount;
    }

    p.currentOrbitRadius = baseRadius;
    p.currentOrbitSpeed = p.orbitSpeed !== undefined ? p.orbitSpeed : 3;
  }

  // 3. Movement Update
  // 시간 기반 절대 회전각 계산 (모든 구슬 동기화)
  // W08 등 ORBIT 패턴의 무기는 속도가 일정하다고 가정하고 시간 기반으로 동기화
  const timeSec = Date.now() / 1000;
  const baseAngle = timeSec * (p.currentOrbitSpeed || 1);

  // 슬롯별 오프셋 적용 (균등 배치를 위해)
  const slotOffset = ((p.slotIndex || 0) / (p.slotTotal || 1)) * Math.PI * 2;
  p.orbitAngle = baseAngle + slotOffset;

  proj.position.x = center.x + Math.cos(p.orbitAngle) * p.currentOrbitRadius;
  proj.position.y = center.y + Math.sin(p.orbitAngle) * p.currentOrbitRadius;

  // Tangent Rotation (Facing movement direction)
  proj.angle = p.orbitAngle + Math.PI / 2;
};

/**
 * RETURN - 부메랑 (일정 거리 후 플레이어로 복귀)
 */
const updateReturn: BehaviorFunction = (proj, dt) => {
  // Visual Spin Effect (Renderer uses visualAngle if present)
  (proj as any).visualAngle = ((proj as any).visualAngle || 0) + 20 * dt;

  const player = getPlayer();
  if (!player) {
    proj.isExpired = true;
    return;
  }

  const speed = (proj as any).speed || 200;
  const returnDistance = (proj as any).returnDistance || 400;

  // 시작점 저장 (첫 프레임)
  if (!(proj as any).startPos) {
    (proj as any).startPos = { x: proj.position.x, y: proj.position.y };
  }

  const startPos = (proj as any).startPos;
  const distFromStart = Math.sqrt(
    Math.pow(proj.position.x - startPos.x, 2) + Math.pow(proj.position.y - startPos.y, 2),
  );

  // 일정 거리 도달 시 복귀 모드 전환
  if (distFromStart >= returnDistance) {
    (proj as any).hasReturned = true;
  }

  if ((proj as any).hasReturned) {
    // 플레이어 방향으로 복귀
    const dx = player.position.x - proj.position.x;
    const dy = player.position.y - proj.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      (proj as any).hasFullyReturned = true;
      proj.isExpired = true;
      return;
    }

    proj.angle = Math.atan2(dy, dx);
  }

  // 이동
  const angle = proj.angle ?? 0;
  proj.position.x += Math.cos(angle) * speed * dt;
  proj.position.y += Math.sin(angle) * speed * dt;
};

/**
 * BOUNCE - 벽/화면 끝에서 튕김
 */
const updateBounce: BehaviorFunction = (proj, dt) => {
  const speed = (proj as any).speed || 280;
  const currentAngle = proj.angle ?? 0;

  // 이동
  proj.position.x += Math.cos(currentAngle) * speed * dt;
  proj.position.y += Math.sin(currentAngle) * speed * dt;

  // 화면 경계 체크 (임시로 1920x1080 가정, 실제로는 CONFIG 사용)
  const margin = 20;
  const worldWidth = 1920;
  const worldHeight = 1080;

  // 좌우 벽 튕김
  if (proj.position.x < margin || proj.position.x > worldWidth - margin) {
    proj.angle = Math.PI - currentAngle;
    proj.position.x = Math.max(margin, Math.min(worldWidth - margin, proj.position.x));

    // 튕김 횟수 감소
    if (proj.penetration) {
      proj.penetration--;
      if (proj.penetration <= 0) proj.isExpired = true;
    }
  }

  // 상하 벽 튕김
  if (proj.position.y < margin || proj.position.y > worldHeight - margin) {
    proj.angle = -currentAngle;
    proj.position.y = Math.max(margin, Math.min(worldHeight - margin, proj.position.y));

    // 튕김 횟수 감소
    if (proj.penetration) {
      proj.penetration--;
      if (proj.penetration <= 0) proj.isExpired = true;
    }
  }
};

/**
 * ARC - 포물선 궤적
 */
const updateArc: BehaviorFunction = (proj, dt) => {
  const speed = (proj as any).speed || 180;
  const gravity = 400; // 중력 가속도

  // 초기 속도 저장
  if ((proj as any).velocityY === undefined) {
    (proj as any).velocityY = -300; // 위로 던지기
  }

  // 수평 이동
  const angle = proj.angle ?? 0;
  proj.position.x += Math.cos(angle) * speed * dt;

  // 수직 이동 (중력 적용)
  (proj as any).velocityY += gravity * dt;
  proj.position.y += (proj as any).velocityY * dt;

  // 땅에 닿으면 폭발 (임시로 y > 1000)
  if (proj.position.y > 1000) {
    proj.isExpired = true;
  }
};

/**
 * LINEAR - 직선 이동 (감속 없음, NORMAL과 유사하지만 명시적)
 */
const updateLinear: BehaviorFunction = (proj, dt) => {
  const speed = (proj as any).speed || 400;
  const angle = proj.angle ?? 0;
  proj.position.x += Math.cos(angle) * speed * dt;
  proj.position.y += Math.sin(angle) * speed * dt;
};

/**
 * SWING - 중심점 기준으로 부채꼴 휘두르기
 */
const updateSwing: BehaviorFunction = (proj, dt) => {
  const center = (proj as any).swingCenter;
  if (!center) {
    proj.isExpired = true;
    return;
  }

  // 시간 경과
  (proj as any).swingTime = ((proj as any).swingTime || 0) + dt * 1000;

  const duration = (proj as any).duration || 300;
  if ((proj as any).swingTime >= duration) {
    proj.isExpired = true;
    return;
  }

  // 각도 계산 (Sine wave로 왕복 또는 선형 이동)
  // 여기서는 한 번 휘두르기: -Range/2 -> +Range/2
  const progress = (proj as any).swingTime / duration; // 0.0 ~ 1.0
  const range = (proj as any).swingRange || Math.PI;
  const baseAngle = (proj as any).swingBaseAngle || 0;

  // 시작(-0.5) -> 끝(+0.5)
  const currentOffset = (progress - 0.5) * range * 2; // 단순히 쓱 지나감
  const currentAngle = baseAngle + currentOffset;

  const radius = (proj as any).radius + 30; // 무기 크기 + 약간의 거리

  proj.position.x = center.x + Math.cos(currentAngle) * radius;
  proj.position.y = center.y + Math.sin(currentAngle) * radius;
  proj.angle = currentAngle; // 검의 방향도 같이 회전
};

/**
 * STAB - 꼬리 주변 돌면서 찌르기 (Fallback/Legacy)
 */
const updateStab: BehaviorFunction = (proj, dt) => {
  const center = (proj as any).stabCenter;
  if (!center) {
    proj.isExpired = true;
    return;
  }

  // Simple Orbit logic for fallback
  const p = proj as any;
  p.orbitAngle = (p.orbitAngle || 0) + (p.orbitSpeed || 1) * dt;
  p.position.x = center.x + Math.cos(p.orbitAngle) * (p.radius || 50);
  p.position.y = center.y + Math.sin(p.orbitAngle) * (p.radius || 50);
};

/**
 * ORBIT_STAB - Guardian Pattern (User Request Implementation)
 * 기본 상태: 플레이어 주변 회전 (ORBIT)
 * 공격 상태: 적 감지 시 찌르기 (STAB)
 * 복귀 상태: 원래 위치로 복귀 (RECOVER) + Cooltime
 */
const updateOrbitStab: BehaviorFunction = (proj, dt) => {
  const p = proj as any;

  // 1. Owner Resolution (Persistent) - Grace Period Applied
  let center = { x: 0, y: 0 };

  if (p.parentID) {
    let owner = null;
    if (p.parentID === "snake_head") {
      owner = getPlayer();
    } else {
      const tails = getTail() as any[];
      owner = tails.find((t: any) => t.id === p.parentID);
    }

    if (owner) {
      center = owner.position;
      p.missingOwnerTime = 0;
    } else {
      p.missingOwnerTime = (p.missingOwnerTime || 0) + dt;
      if (p.missingOwnerTime > 0.5) {
        proj.isExpired = true;
        return;
      }
      center = { x: proj.position.x, y: proj.position.y }; // Stay put
    }
  } else {
    // Fallback
    center = p.orbitCenter || { x: 0, y: 0 };
  }

  // 2. Initialize Props
  if (!p.state) p.state = "ORBIT";
  p.orbitAngle = p.orbitAngle || 0;
  p.orbitRadiusCurrent = p.orbitRadiusCurrent || p.orbitRadiusBase || 60;

  const baseRadius = p.orbitRadiusBase || 60;
  const stabRange = p.stabRange || 100;
  const triggerRange = p.triggerRange || 200;
  // const orbitSpeed = p.orbitSpeed || 2;
  const stabSpeed = p.stabSpeed || 400;

  // 3. State Machine
  switch (p.state) {
    case "ORBIT": {
      // Slot Alignment logic (Static positions, no rotation)
      if (p.slotTotal > 1) {
        const targetAngle = (Math.PI * 2 * (p.slotIndex || 0)) / p.slotTotal;

        // Shortest path interpolation
        let diff = targetAngle - p.orbitAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const rotationSpeed = 15 * dt; // Fast snap back to slot
        if (Math.abs(diff) > rotationSpeed) {
          p.orbitAngle += Math.sign(diff) * rotationSpeed;
        } else {
          p.orbitAngle = targetAngle;
        }
      } else if (p.slotTotal === 1) {
        // Solo sword: also stay at 0 angle (or top)
        p.orbitAngle = 0;
      }

      // Radius Restoration (Lerp back to base)
      if (Math.abs(p.orbitRadiusCurrent - baseRadius) > 0.5) {
        const lerpSpeed = 10;
        p.orbitRadiusCurrent += (baseRadius - p.orbitRadiusCurrent) * lerpSpeed * dt;
      } else {
        p.orbitRadiusCurrent = baseRadius;
      }

      // 쿨타임 체크 (진동 방지)
      p.attackCooldown = (p.attackCooldown || 0) - dt;
      if (p.attackCooldown > 0) break;

      // Find Nearest Enemy to target
      const enemies = getEnemies() as any[];
      let nearest = null;
      let minDSq = triggerRange * triggerRange;

      for (const e of enemies) {
        if (e.isExpired) continue;
        const dx = e.position.x - center.x;
        const dy = e.position.y - center.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDSq) {
          minDSq = dSq;
          nearest = e;
        }
      }

      if (nearest) {
        // Aim exactly at the enemy + Slight Offset to keep multiple swords visible
        const baseAngle = Math.atan2(nearest.position.y - center.y, nearest.position.x - center.x);
        const jitter = ((p.slotIndex || 0) - (p.slotTotal - 1) / 2) * 0.15;
        p.orbitAngle = baseAngle + jitter;
        p.state = "STAB";
      }
      break;
    }

    case "STAB": {
      // Rotation stops during stab (Fixed Direction)
      // p.orbitAngle += orbitSpeed * 0.2 * dt; // Removed

      // Stab Outward
      p.orbitRadiusCurrent += stabSpeed * dt;

      // Check max range
      if (p.orbitRadiusCurrent >= baseRadius + stabRange) {
        p.state = "RECOVER";
      }
      break;
    }

    case "RECOVER": {
      // 복귀 상태: 회전 멈춤 유지 (원래 궤도로 복귀만 함)
      // p.orbitAngle += orbitSpeed * dt; // Removed to stop rotation during return

      // Return Inward
      const returnSpeed = stabSpeed * 1.5; // Much faster return (Snappy)
      p.orbitRadiusCurrent -= returnSpeed * dt;

      if (p.orbitRadiusCurrent <= baseRadius) {
        p.orbitRadiusCurrent = baseRadius;
        p.state = "ORBIT";

        // Apply Speed Multiplier to Cooldown
        const speedMult = (p as any).speedMult || 1.0;
        p.attackCooldown = 0.5 / speedMult; // 복귀 후 대기 시간 (공속이 빠르면 줄어듦)
      }
      break;
    }
  }

  // 4. Update Position
  proj.position.x = center.x + Math.cos(p.orbitAngle) * p.orbitRadiusCurrent;
  proj.position.y = center.y + Math.sin(p.orbitAngle) * p.orbitRadiusCurrent;

  // 5. Rotation (Tangent / Outward)
  // 5. Rotation (Tangent / Outward)
  // Always point outward as requested
  proj.angle = p.orbitAngle;
};

/**
 * HOMING - 가장 가까운 적을 추격
 */
const updateHoming: BehaviorFunction = (proj, dt) => {
  const p = proj as any;
  const speed = p.speed || 200;
  const turnSpeed = (p.turnSpeed || 5) * dt; // turn speed in radians per sec

  // 1. Target Resolution
  if (!p.homingTarget || p.homingTarget.isExpired) {
    const enemies = getEnemies();
    let nearest = null;
    let minDSq = 1000 * 1000; // 탐색 범위 대폭 확장 (600 -> 1000)

    for (const e of enemies) {
      if (e.isExpired) continue;
      const dx = e.position.x - proj.position.x;
      const dy = e.position.y - proj.position.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDSq) {
        minDSq = dSq;
        nearest = e;
      }
    }
    p.homingTarget = nearest;
  }

  // 2. Adjust Angle
  if (p.homingTarget) {
    const targetAngle = Math.atan2(
      p.homingTarget.position.y - proj.position.y,
      p.homingTarget.position.x - proj.position.x,
    );

    // Smoothly rotate current angle towards target angle
    let currentAngle = proj.angle || 0;
    let angleDiff = targetAngle - currentAngle;

    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) < turnSpeed) {
      proj.angle = targetAngle;
    } else {
      proj.angle = currentAngle + Math.sign(angleDiff) * turnSpeed;
    }
  }

  // 3. Move forward
  const angle = proj.angle || 0;
  proj.position.x += Math.cos(angle) * speed * dt; // 누락된 X축 이동 추가
  proj.position.y += Math.sin(angle) * speed * dt;
};

/**
 * BOTTLE - 지정된 위치로 포물선을 그리며 투척됨
 */
const updateBottle: BehaviorFunction = (proj, dt) => {
  const p = proj as any;
  if (!p.targetPos) {
    proj.isExpired = true;
    return;
  }

  // [필독] 거리에 상관없이 터지는 시간은 무조건 동일하게 (800ms)
  const FLIGHT_DURATION = 0.8;
  p.elapsedTime = (p.elapsedTime || 0) + dt;
  const progress = Math.min(1, p.elapsedTime / FLIGHT_DURATION);

  // 시작점 저장
  if (!p.startPos) {
    p.startPos = { x: proj.position.x, y: proj.position.y };
  }

  // 선형 보간으로 현재 물리 위치 계산 (속도가 거리에 비례하게 자동 계산됨)
  proj.position.x = p.startPos.x + (p.targetPos.x - p.startPos.x) * progress;
  proj.position.y = p.startPos.y + (p.targetPos.y - p.startPos.y) * progress;

  // 1. 포물선 높이 (Y축 오프셋)
  p.arcHeight = Math.sin(progress * Math.PI) * 120; // 높이 상향

  // 2. 원근법: 하늘 높이 올라갈수록 화면 앞으로 나오는 느낌 (Scale 1.0 -> 3.0 -> 1.0)
  p.visualScale = 1.0 + Math.sin(progress * Math.PI) * 2.0;

  // 회전 연출
  proj.angle = (proj.angle || 0) + 6 * dt;

  // 비행 시간 종료 시 소멸 및 장판 생성
  if (progress >= 1) {
    proj.isExpired = true;
    p.hasReachedTarget = true;

    // [중요] 여기서 즉시 장판 생성
    const areaStats = p.areaStats;
    if (areaStats) {
      console.log("[BOTTLE] Shattering at", proj.position);

      // 장판 생성
      const area = createArea(proj.position.x, proj.position.y, proj.type, "STATIC", areaStats);
      addArea(area);
      console.log("[BOTTLE] Area created:", area.id);

      // 병 깨지는 시각 효과 (폭발 VFX)
      VFXFactory.createExplosion(proj.position.x, proj.position.y, proj.type, 15, 0.6);
    } else {
      console.error("[BOTTLE] No areaStats found!");
    }
  }
};

/**
 * 행동 맵
 */
const behaviorMap: Record<ProjectileBehavior, BehaviorFunction> = {
  NORMAL: updateNormal,
  ORBIT: updateOrbit,
  RETURN: updateReturn,
  BOUNCE: updateBounce,
  ARC: updateArc,
  LINEAR: updateLinear,
  SWING: updateSwing,
  STAB: updateStab,
  ORBIT_STAB: updateOrbitStab,
  HOMING: updateHoming,
  BOTTLE: updateBottle,
};

/**
 * Projectile 행동 업데이트
 */
export function updateProjectileBehavior(proj: Projectile, dt: number): void {
  const behavior = ((proj as any).behavior as ProjectileBehavior) || "NORMAL";
  const updateFn = behaviorMap[behavior];

  if (updateFn) {
    updateFn(proj, dt);
  } else {
    // Fallback to normal
    updateNormal(proj, dt);
  }
}
