import { Projectile } from "@/game/types";
import { getPlayer, getEnemies, getTail, addScore, addXPGem } from "@/game/managers/state";
import { addArea } from "@/game/managers/entityStore"; // Fix circular dependency
import { createArea } from "@/game/entities/area";
import { VFXFactory } from "@/engine/vfx/VFXFactory";
import { damageTextManager } from "@/game/managers/damageTextManager";

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
  | "BLOSSOM"
  | "HOMING"
  | "BOTTLE"
  | "BEAM"
  | "BAT"
  | "GRAVITY_ORB"
  | "CHAKRAM"
  | "FLAME";

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
  const p = proj as any;
  const gravity = p.gravity || 800; // 중력 가속도

  // Physics Update
  if (p.vx === undefined) p.vx = Math.cos(proj.angle || 0) * (p.speed || 180);
  if (p.vy === undefined) p.vy = -400; // Default upward impulse

  p.vy += gravity * dt;
  p.position.x += p.vx * dt;
  p.position.y += p.vy * dt;

  // Rotation
  p.visualAngle = (p.visualAngle || 0) + (p.rotationSpeed || 10) * dt;

  // 화면 아래로 떨어지면 만료 (World Height + Margin)
  if (p.position.y > 2000) {
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
 * BLOSSOM - Senbonzakura style orbit > dash > return.
 */
const updateBlossom: BehaviorFunction = (proj, dt) => {
  const p = proj as any;

  let center = { x: proj.position.x, y: proj.position.y };
  if (p.parentID) {
    const owner =
      p.parentID === "snake_head"
        ? getPlayer()
        : (getTail() as any[]).find((t: any) => t.id === p.parentID);
    if (owner) {
      center = { x: owner.position.x, y: owner.position.y };
      p.missingOwnerTime = 0;
    } else {
      p.missingOwnerTime = (p.missingOwnerTime || 0) + dt;
      if (p.missingOwnerTime > 0.5) {
        proj.isExpired = true;
        return;
      }
    }
  }

  if (!p.state) p.state = "ORBIT";
  if (p.orbitRadiusCurrent === undefined) p.orbitRadiusCurrent = p.orbitRadiusBase || 55;
  if (!p.chainHitIds) p.chainHitIds = [] as string[];

  const orbitSpeed = p.orbitSpeedBase || p.orbitSpeed || 1.2;
  const orbitRadius = p.orbitRadiusBase || 55;
  const triggerRange = p.triggerRange || 180;
  const dashRange = p.stabRange || 220;
  const dashSpeed = p.dashSpeed || p.stabSpeed || 320;
  const returnSpeed = p.returnSpeed || dashSpeed * 1.2;
  const speedMult = p.speedMult || 1;
  const maxChainHits = Math.max(1, p.maxChainHits || 1);
  const chainSearchRange = p.chainSearchRange || dashRange;

  const points = (p.trailPoints || []) as Array<{ x: number; y: number; life: number }>;
  const trailDecay = p.trailDecay || 2.2;
  const trailMaxLength = p.trailMaxLength || 16;
  for (let i = points.length - 1; i >= 0; i--) {
    points[i].life -= trailDecay * dt;
    if (points[i].life <= 0) points.splice(i, 1);
  }
  p.trailPoints = points;

  const pushTrailPoint = () => {
    points.push({ x: proj.position.x, y: proj.position.y, life: 1 });
    if (points.length > trailMaxLength) points.splice(0, points.length - trailMaxLength);
  };

  const findNearestEnemy = (fromX: number, fromY: number, range: number, excluded: string[] = []) => {
    const enemies = getEnemies() as any[];
    let nearest: any = null;
    let minDistSq = range * range;
    for (const e of enemies) {
      if (e.isExpired || e.hp <= 0) continue;
      if (excluded.includes(e.id)) continue;
      const dx = e.position.x - fromX;
      const dy = e.position.y - fromY;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = e;
      }
    }
    return nearest;
  };

  const distancePointToSegmentSq = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number => {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const lenSq = vx * vx + vy * vy;
    if (lenSq <= 0.0001) {
      const dx = px - x1;
      const dy = py - y1;
      return dx * dx + dy * dy;
    }
    let t = (wx * vx + wy * vy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + vx * t;
    const cy = y1 + vy * t;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy;
  };

  const findDashCollisionEnemy = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    excluded: string[],
  ) => {
    const enemies = getEnemies() as any[];
    const hitRadius = (p.radius || 8) + 20;
    const hitRadiusSq = hitRadius * hitRadius;
    let picked: any = null;
    let minSegDistSq = Infinity;
    for (const e of enemies) {
      if (e.isExpired || e.hp <= 0) continue;
      if (excluded.includes(e.id)) continue;
      const segDistSq = distancePointToSegmentSq(e.position.x, e.position.y, x1, y1, x2, y2);
      if (segDistSq <= hitRadiusSq && segDistSq < minSegDistSq) {
        minSegDistSq = segDistSq;
        picked = e;
      }
    }
    return picked;
  };

  const applyHit = (enemy: any) => {
    const defense = enemy.defense || 0;
    const dmg = Math.max(1, proj.damage - defense);
    enemy.hp -= dmg;
    damageTextManager.show(enemy.position.x, enemy.position.y, Math.floor(dmg), false);
    VFXFactory.createImpact(proj.position.x, proj.position.y, proj.type);

    if (enemy.hp <= 0) {
      enemy.isExpired = true;
      addScore(enemy.type === "BOSS" ? 1000 : 50);
      const xpMin = enemy.type === "BOSS" ? 500 : enemy.type === "TANK" ? 10 : enemy.type === "FAST" ? 2 : 1;
      const xpMax = enemy.type === "BOSS" ? 1000 : enemy.type === "TANK" ? 20 : enemy.type === "FAST" ? 5 : 3;
      const xpAmount = Math.floor(xpMin + Math.random() * (xpMax - xpMin + 1));
      addXPGem(enemy.position.x, enemy.position.y, xpAmount);
    }
  };

  switch (p.state) {
    case "ORBIT": {
      const timeSec = Date.now() / 1000;
      const slotOffset = ((p.slotIndex || 0) / Math.max(1, p.slotTotal || 1)) * Math.PI * 2;
      const orbitAngle = timeSec * orbitSpeed + slotOffset;
      p.orbitAngle = orbitAngle;

      proj.position.x = center.x + Math.cos(orbitAngle) * orbitRadius;
      proj.position.y = center.y + Math.sin(orbitAngle) * orbitRadius;
      proj.angle = orbitAngle + Math.PI / 2;

      p.attackCooldown = (p.attackCooldown || 0) - dt;
      if (p.attackCooldown > 0) break;

      const nearest = findNearestEnemy(proj.position.x, proj.position.y, triggerRange);
      if (!nearest) break;

      p.targetId = nearest.id;
      const lockDx = nearest.position.x - proj.position.x;
      const lockDy = nearest.position.y - proj.position.y;
      const lockDist = Math.sqrt(lockDx * lockDx + lockDy * lockDy);
      p.currentDashLimit = Math.max(dashRange, lockDist + 28);
      p.state = "DASH";
      p.dashTraveled = 0;
      p.chainHits = 0;
      p.chainHitIds = [];
      if (p.hitTracker) p.hitTracker = {};
      pushTrailPoint();
      break;
    }

    case "DASH": {
      const enemies = getEnemies() as any[];
      let target = enemies.find(e => e.id === p.targetId && !e.isExpired && e.hp > 0);
      if (!target) {
        target = findNearestEnemy(proj.position.x, proj.position.y, chainSearchRange, p.chainHitIds);
        if (target) p.targetId = target.id;
      }
      if (!target) {
        p.state = "RETURN";
        break;
      }

      const prevX = proj.position.x;
      const prevY = proj.position.y;
      let dx = target.position.x - prevX;
      let dy = target.position.y - prevY;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.001) dist = 0.001;
      dx /= dist;
      dy /= dist;

      const step = Math.min(dashSpeed * dt, dist);
      proj.position.x = prevX + dx * step;
      proj.position.y = prevY + dy * step;
      proj.angle = Math.atan2(dy, dx);
      p.dashTraveled = (p.dashTraveled || 0) + step;
      pushTrailPoint();

      const collided = findDashCollisionEnemy(prevX, prevY, proj.position.x, proj.position.y, p.chainHitIds);

      if (collided) {
        applyHit(collided);
        p.chainHitIds.push(collided.id);
        p.chainHits = (p.chainHits || 0) + 1;

        if (p.chainHits < maxChainHits) {
          const nextTarget = findNearestEnemy(collided.position.x, collided.position.y, chainSearchRange, p.chainHitIds);
          if (nextTarget) {
            p.targetId = nextTarget.id;
            const chainDx = nextTarget.position.x - proj.position.x;
            const chainDy = nextTarget.position.y - proj.position.y;
            const chainDist = Math.sqrt(chainDx * chainDx + chainDy * chainDy);
            p.currentDashLimit = Math.max(dashRange, chainDist + 22);
          } else {
            p.state = "RETURN";
          }
        } else {
          p.state = "RETURN";
        }
      } else if (p.dashTraveled >= (p.currentDashLimit || dashRange)) {
        p.state = "RETURN";
      }
      break;
    }

    case "RETURN": {
      const timeSec = Date.now() / 1000;
      const slotOffset = ((p.slotIndex || 0) / Math.max(1, p.slotTotal || 1)) * Math.PI * 2;
      const targetAngle = timeSec * orbitSpeed + slotOffset;
      const targetX = center.x + Math.cos(targetAngle) * orbitRadius;
      const targetY = center.y + Math.sin(targetAngle) * orbitRadius;

      let dx = targetX - proj.position.x;
      let dy = targetY - proj.position.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.001) dist = 0.001;
      dx /= dist;
      dy /= dist;

      const step = Math.min(returnSpeed * dt, dist);
      proj.position.x += dx * step;
      proj.position.y += dy * step;
      proj.angle = Math.atan2(dy, dx);
      pushTrailPoint();

      if (dist < 10) {
        p.state = "ORBIT";
        p.attackCooldown = 0.28 / speedMult;
      }
      break;
    }
  }
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
      // 장판 생성
      const area = createArea(proj.position.x, proj.position.y, proj.type, "STATIC", areaStats);
      addArea(area);

      // 병 깨지는 시각 효과 (폭발 VFX)
      VFXFactory.createExplosion(proj.position.x, proj.position.y, proj.type, 15, 0.6);
    } else {
      console.error("[BOTTLE] No areaStats found!");
    }
  }
};

/**
 * BEAM - 레이저 빔 (고정 위치, 일직선, 틱 데미지)
 */
const updateBeam = (proj: Projectile, dt: number) => {
  const p = proj as any;

  // 1. 소유자 위치 동기화 (꼬리 따라다니기)
  if (p.ownerId) {
    const tailList = getTail();
    const tail = tailList.find((t: any) => t.id === p.ownerId);

    if (tail) {
      // 꼬리 위치로 이동
      proj.position.x = tail.position.x;
      proj.position.y = tail.position.y;
    } else {
      // 꼬리가 없으면 플레이어인지 확인
      const player = getPlayer();
      if (player && player.id === p.ownerId) {
        proj.position.x = player.position.x;
        proj.position.y = player.position.y;
      }
    }
  }

  // 지속 시간 감소
  if (!p.beamDuration) p.beamDuration = p.duration || 2000;
  p.beamDuration -= dt * 1000;

  if (p.beamDuration <= 0) {
    proj.isExpired = true;
    return;
  }

  // 틱 데미지 처리
  const now = Date.now();
  if (!p.lastBeamTick) p.lastBeamTick = 0;
  const tickInterval = p.hitInterval || 100;

  if (now - p.lastBeamTick >= tickInterval) {
    p.lastBeamTick = now;

    // 레이저 선과 교차하는 적 찾기
    const beamLength = p.range || 1000;
    const beamWidth = p.radius || 10;
    const enemies = getEnemies();

    const startX = proj.position.x;
    const startY = proj.position.y;
    const angle = proj.angle || 0;
    const endX = startX + Math.cos(angle) * beamLength;
    const endY = startY + Math.sin(angle) * beamLength;

    enemies.forEach((enemy: any) => {
      if (enemy.isExpired || enemy.hp <= 0) return;

      // 점과 선분 사이의 거리 계산
      const ex = enemy.position.x;
      const ey = enemy.position.y;

      // 선분의 벡터
      const dx = endX - startX;
      const dy = endY - startY;
      const lenSq = dx * dx + dy * dy;

      if (lenSq === 0) return; // 길이 0인 레이저

      // 적 위치를 선분에 투영
      const t = Math.max(0, Math.min(1, ((ex - startX) * dx + (ey - startY) * dy) / lenSq));
      const projX = startX + t * dx;
      const projY = startY + t * dy;

      // 투영점과 적 사이의 거리
      const distSq = (ex - projX) * (ex - projX) + (ey - projY) * (ey - projY);
      const hitRadius = beamWidth + 20; // 적 크기 고려

      if (distSq <= hitRadius * hitRadius) {
        // 데미지 적용
        // Note: proj.damage already includes unified multiplier
        const actualDamage = proj.damage;
        enemy.hp -= actualDamage;

        // 데미지 텍스트 표시
        damageTextManager.show(enemy.position.x, enemy.position.y, actualDamage, false);
      }
    });
  }
};

/**
 * BAT - 박쥐 소환 (유도 + 웨이브 이동 + 흡혈)
 */
const updateBat: BehaviorFunction = (proj, dt) => {
  const p = proj as any;
  const speed = p.speed || 150;
  const turnSpeed = 4 * dt; // 회전 속도

  // 1. 적 추적 (HOMING)
  if (!p.homingTarget || p.homingTarget.isExpired || p.homingTarget.hp <= 0) {
    const enemies = getEnemies();
    let nearest = null;
    let minDSq = 800 * 800; // 탐색 범위

    for (const e of enemies) {
      if (e.isExpired || e.hp <= 0) continue;
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

  // 2. 각도 조정
  let targetAngle = proj.angle || 0;
  if (p.homingTarget) {
    targetAngle = Math.atan2(p.homingTarget.position.y - proj.position.y, p.homingTarget.position.x - proj.position.x);
  }

  // 부드러운 회전
  let currentAngle = proj.angle || 0;
  let angleDiff = targetAngle - currentAngle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  if (Math.abs(angleDiff) < turnSpeed) {
    proj.angle = targetAngle;
  } else {
    proj.angle = currentAngle + Math.sign(angleDiff) * turnSpeed;
  }

  // 3. 이동 (웨이브 모션)
  p.waveTime = (p.waveTime || 0) + dt * 5; // 날개짓 속도
  const waveAmplitude = 5; // 위아래 흔들림 폭
  const waveOffset = Math.sin(p.waveTime + (p.waveOffset || 0)) * waveAmplitude;

  // 진행 방향(angle)에 수직인 벡터 계산
  const perpX = Math.cos(proj.angle + Math.PI / 2);
  const perpY = Math.sin(proj.angle + Math.PI / 2);

  // 기본 이동 + 웨이브 오프셋
  const moveX = Math.cos(proj.angle) * speed * dt + perpX * waveOffset * dt * 20; // 웨이브 효과 강조
  const moveY = Math.sin(proj.angle) * speed * dt + perpY * waveOffset * dt * 20;

  proj.position.x += moveX;
  proj.position.y += moveY;

  // 4. 충돌 체크 및 흡혈
  // 성능을 위해 간단한 거리 체크
  if (p.homingTarget) {
    const dx = p.homingTarget.position.x - proj.position.x;
    const dy = p.homingTarget.position.y - proj.position.y;
    const distSq = dx * dx + dy * dy;
    const hitRadius = ((proj as any).radius || 10) + 20; // 적 크기 고려

    if (distSq < hitRadius * hitRadius) {
      // 충돌!
      // Note: proj.damage already includes unified multiplier
      const player = getPlayer();
      const actualDamage = proj.damage;
      p.homingTarget.hp -= actualDamage;
      damageTextManager.show(p.homingTarget.position.x, p.homingTarget.position.y, actualDamage, false);

      // 흡혈
      if (p.lifeSteal > 0) {
        if (player) {
          const oldHp = player.stats.hp;
          player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + p.lifeSteal);
          const healed = player.stats.hp - oldHp;
          if (healed > 0) {
            // 힐 텍스트 표시 (초록색)
            damageTextManager.show(player.position.x, player.position.y - 30, healed, false);
          }
        }
      }

      // 소멸 (관통 1이므로)
      proj.isExpired = true;

      // 타격 이펙트
      VFXFactory.createExplosion(proj.position.x, proj.position.y, proj.type, 10, 0.5);
    }
  }
};

/**
 * GRAVITY_ORB - 느린 중력 구체 (적과 충돌 시 블랙홀 생성)
 */
const updateGravityOrb: BehaviorFunction = (proj, dt) => {
  const p = proj as any;
  const speed = p.speed || 120;
  const angle = proj.angle ?? 0;

  // 1. 이동
  const dx = Math.cos(angle) * speed * dt;
  const dy = Math.sin(angle) * speed * dt;
  proj.position.x += dx;
  proj.position.y += dy;

  // 이동 거리 추적
  p.distanceTraveled = (p.distanceTraveled || 0) + Math.sqrt(dx * dx + dy * dy);

  // 2. 적과 충돌 체크
  const enemies = getEnemies() as any[];
  const orbRadius = p.radius || 12;
  let hitEnemy = false;

  for (const enemy of enemies) {
    if (enemy.isExpired || enemy.hp <= 0) continue;
    const ex = enemy.position.x - proj.position.x;
    const ey = enemy.position.y - proj.position.y;
    const distSq = ex * ex + ey * ey;
    const hitDist = orbRadius + 20; // 적 히트박스 고려

    if (distSq < hitDist * hitDist) {
      hitEnemy = true;
      break;
    }
  }

  // 3. 최대 사거리 도달 체크
  const maxRange = p.maxRange || 400;
  const reachedMaxRange = p.distanceTraveled >= maxRange;

  // 4. 충돌 또는 최대 사거리 도달 시 블랙홀 생성
  if (hitEnemy || reachedMaxRange) {
    proj.isExpired = true;

    // 블랙홀 (VORTEX) 장판 생성
    const areaStats = p.areaStats;
    if (areaStats) {
      const area = createArea(proj.position.x, proj.position.y, proj.type, "VORTEX", areaStats);
      area.vortexStrength = p.vortexStrength || 300;
      addArea(area);

      // 폭발 이펙트 제거 (블랙홀 생성으로 충분함)
    }
  }
};

/**
 * CHAKRAM - 적 간 튕기는 차크람
 * 적에게 맞으면 데미지 주고, 근처 다른 적을 찾아 튕김.
 * 튕김 횟수(penetration)가 0이 되거나 다음 적이 없으면 소멸.
 */
const updateChakram: BehaviorFunction = (proj, dt) => {
  const p = proj as any;
  const speed = p.speed || 280;
  const angle = proj.angle ?? 0;

  // 회전 시각 효과
  p.visualAngle = (p.visualAngle || 0) + 15 * dt;

  // 1. 이동
  proj.position.x += Math.cos(angle) * speed * dt;
  proj.position.y += Math.sin(angle) * speed * dt;

  // 2. 적과 충돌 체크
  const enemies = getEnemies() as any[];
  const chakramRadius = p.radius || 16;
  const hitEnemyIds: string[] = p.hitEnemyIds || [];

  for (const enemy of enemies) {
    if (enemy.isExpired || enemy.hp <= 0) continue;
    // 이미 이번 체인에서 맞은 적은 건너뛰기
    if (hitEnemyIds.includes(enemy.id)) continue;

    const ex = enemy.position.x - proj.position.x;
    const ey = enemy.position.y - proj.position.y;
    const distSq = ex * ex + ey * ey;
    const hitDist = chakramRadius + 20;

    if (distSq < hitDist * hitDist) {
      // 타격!
      // Note: proj.damage already includes unified multiplier
      const actualDamage = proj.damage;
      enemy.hp -= actualDamage;
      damageTextManager.show(enemy.position.x, enemy.position.y, actualDamage, false);

      // 적 사망 체크
      if (enemy.hp <= 0) {
        enemy.isExpired = true;
      }

      // 타격 이펙트
      VFXFactory.createImpact(proj.position.x, proj.position.y, proj.type);

      // 맞은 적 기록
      hitEnemyIds.push(enemy.id);
      p.hitEnemyIds = hitEnemyIds;

      // 튕김 횟수 감소
      proj.penetration--;

      // 튕김 횟수가 남았을 때만 반사(Bounce) 처리
      if (proj.penetration > 0) {
        // [반사 로직] 유도 대신 물리적 반사각 적용

        // 법선 벡터 (Normal): 적 중심 → 투사체 위치
        const nx = proj.position.x - enemy.position.x;
        const ny = proj.position.y - enemy.position.y;
        const dist = Math.sqrt(nx * nx + ny * ny);

        // 정규화 (거리가 0이면 임의 방향)
        const ux = dist > 0 ? nx / dist : 1;
        const uy = dist > 0 ? ny / dist : 0;

        // 현재 속도 벡터
        const vx = Math.cos(proj.angle!);
        const vy = Math.sin(proj.angle!);

        // 반사 벡터 계산: R = V - 2(V·N)N
        const dot = vx * ux + vy * uy;
        const rx = vx - 2 * dot * ux;
        const ry = vy - 2 * dot * uy;

        proj.angle = Math.atan2(ry, rx);
      }
      // 튕김 횟수 다 쓰면? -> 그냥 원래 방향으로 계속 날아감 (관통)

      return; // 한 프레임에 하나의 적만 타격
    }
  }
};

/**
 * FLAME - 화염 방사 입자
 * 앞으로 나아가며 점점 커지고 느려짐.
 */
const updateFlame: BehaviorFunction = (proj, dt) => {
  const p = proj as any;

  // 초기화 (한 번만 실행)
  if (p.initialDir === undefined) {
    p.initialDir = { x: Math.cos(proj.angle!), y: Math.sin(proj.angle!) };
    p.turbulenceSeed = Math.random() * 100; // 난기류 시드
    p.riseSpeed = 0; // 상승 속도
  }

  const initialSpeed = p.speed || 550;
  const maxDuration = p.maxDuration || 350;
  const currentDuration = p.duration || 0;
  // 1.0 (시작) -> 0.0 (끝)
  const timeProgress = 1 - currentDuration / maxDuration; // 0 -> 1

  // 1. 전진 이동 (강한 감속: Drag)
  // 시간이 지날수록 전진 속도가 급격히 줄어듬 (0.5승으로 초반에 빠르고 나중에 느림)
  const dragFactor = Math.max(0, 1 - Math.pow(timeProgress, 0.5));
  const currentForwardSpeed = initialSpeed * dragFactor;

  // 2. 상승 기류 (Thermal Rise)
  // 시간이 지날수록 위로 떠오름
  p.riseSpeed += 100 * dt; // 초당 100픽셀 가속

  // 3. 난기류 (Turbulence/Wiggle)
  // 진행 방향의 수직 벡터 구하기
  const perpX = -p.initialDir.y;
  const perpY = p.initialDir.x;
  // 사인파로 흔들림 + 랜덤 노이즈
  const wiggle = Math.sin(timeProgress * 10 + p.turbulenceSeed) * 50 * timeProgress;

  // 최종 위치 업데이트
  proj.position.x += (p.initialDir.x * currentForwardSpeed + perpX * wiggle) * dt;
  proj.position.y += (p.initialDir.y * currentForwardSpeed + perpY * wiggle - p.riseSpeed) * dt;

  // 4. 상태 업데이트
  // 크기: 1.0 -> 2.5 (확 퍼짐)
  p.scale = 1.0 + timeProgress * 1.5;

  // 투명도: 0.8까지 유지되다가 급격히 사라짐
  if (timeProgress < 0.7) {
    p.alpha = 1.0;
  } else {
    p.alpha = 1.0 - (timeProgress - 0.7) * 3.3; // 0.7~1.0 구간에서 소멸
  }

  // 회전: 불꽃이 뱅글뱅글 도는 느낌 (시각적)
  proj.angle = (proj.angle || 0) + 2 * dt;
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
  BLOSSOM: updateBlossom,
  HOMING: updateHoming,
  BOTTLE: updateBottle,
  BEAM: updateBeam,
  BAT: updateBat,
  GRAVITY_ORB: updateGravityOrb,
  CHAKRAM: updateChakram,
  FLAME: updateFlame,
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
