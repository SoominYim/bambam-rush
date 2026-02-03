import { Player, ActiveWeapon, Scalar, Vector2D, Enemy, PassiveInstance } from "@/game/types";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import { PASSIVE_REGISTRY } from "@/game/config/passiveRegistry";
import { addProjectile, getEnemies, getTail, getProjectiles } from "@/game/managers/state";
import { createProjectile } from "@/game/entities/projectile";
import { spatialGrid } from "@/game/managers/grid";
import { createArea, AreaBehavior } from "@/game/entities/area";

export const updateWeapons = (player: Player, deltaTime: Scalar) => {
  player.activeWeapons.forEach(aw => {
    const def = WEAPON_REGISTRY[aw.id];
    if (!def) return;

    // Update timer
    aw.timer += deltaTime * 1000; // ms

    const stats = getEffectiveStats(player, aw);

    if (aw.timer >= stats.cooldown) {
      aw.timer = 0;
      aw.lastFired = Date.now();
      triggerWeaponEffect(player, aw, stats);
    }
  });
};

const getEffectiveStats = (player: Player, aw: ActiveWeapon) => {
  const def = WEAPON_REGISTRY[aw.id];
  let stats = { ...def.baseStats };

  // 1. Level Scaling
  for (let lv = 2; lv <= aw.level; lv++) {
    const scale = def.levels[lv];
    if (scale) {
      if (scale.damage) stats.damage += scale.damage;
      if (scale.cooldown) stats.cooldown += scale.cooldown;
      if (scale.count) stats.count += scale.count;
      if (scale.size) stats.size += scale.size;
      if (scale.speed) stats.speed = (stats.speed || 0) + scale.speed;
      if (scale.pierce) stats.pierce = (stats.pierce || 0) + scale.pierce;
      if (scale.range) stats.range = (stats.range || 0) + scale.range;
    }
  }

  // 2. Passive Scaling
  player.passives.forEach((p: PassiveInstance) => {
    const pDef = PASSIVE_REGISTRY[p.id];
    if (!pDef) return;
    const pVal = pDef.levels[p.level]?.value || 0;

    switch (p.id) {
      case "P01": // Might (Damage)
        stats.damage *= 1 + pVal;
        break;
      case "P02": // Cooldown
        stats.cooldown *= 1 + pVal;
        break;
      case "P05": // Speed
        stats.speed = (stats.speed || 0) * (1 + pVal);
        break;
      case "P06": // Duration
        if (stats.duration) stats.duration *= 1 + pVal;
        break;
      case "P13": // Duplicator
        stats.count += pVal;
        break;
      case "P04": // Area (Might affect range too?)
        stats.size *= 1 + pVal;
        if (stats.range) stats.range *= 1 + pVal;
        break;
    }
  });

  stats.cooldown = Math.max(100, stats.cooldown);
  return stats;
};

const triggerWeaponEffect = (player: Player, aw: ActiveWeapon, stats: any) => {
  const def = WEAPON_REGISTRY[aw.id];
  const segments = getTail().filter(s => s.weaponId === aw.id);
  const origin = segments.length > 0 ? segments[0].position : player.position;

  // Determine Owner ID
  const ownerId = segments.length > 0 ? segments[0].id : player.id;

  switch (def.pattern) {
    case "projectile":
      fireProjectile(origin, stats, def.tags[0], aw.id);
      break;
    case "line":
      fireLine(origin, stats, def.tags[0]);
      break;
    case "chain":
      fireChain(origin, stats, def.tags[0]);
      break;
    case "area":
      spawnArea(origin, stats, def.tags[0], "STATIC");
      break;
    case "orbit":
      fireOrbit(origin, stats, def.tags[0], ownerId, aw.id);
      break;
    case "return":
      fireReturn(origin, stats, def.tags[0]);
      break;
    case "spread":
      fireSpread(origin, stats, def.tags[0]);
      break;
    case "linear":
      fireLinear(origin, stats, def.tags[0]);
      break;
    case "nova":
      spawnArea(player.position, stats, def.tags[0], "STATIC"); // 플레이어 위치 중심 폭발
      break;
    case "aura":
      createAuraWeapon(player, stats, def.tags[0]);
      break;
    case "vortex":
      spawnArea(origin, stats, def.tags[0], "VORTEX");
      break;
    case "gas":
      spawnArea(origin, stats, def.tags[0], "DRIFT");
      break;
    case "trap":
      spawnArea(origin, stats, def.tags[0], "TRAP");
      break;
    case "swing":
      fireSwing(origin, stats, def.tags[0]);
      break;
    case "stab":
      fireStab(origin, stats, def.tags[0], ownerId, aw.id);
      break;
  }
};

const fireStab = (origin: Vector2D, stats: any, type: any, _ownerId?: string, _weaponId?: string) => {
  // 찌르기 (Orbit + Stab)
  // 천천히 회전하면서 빠르게 찌르고 돌아옴
  // 연속성을 위해 시간 기반 각도 계산
  const now = Date.now();
  const orbitSpeed = 1.0; // 회전 속도 (Radian per sec)
  const baseAngle = (now / 1000) * orbitSpeed;

  for (let i = 0; i < stats.count; i++) {
    // 여러 개일 경우 각도 등분
    const angleOffset = (Math.PI * 2 * i) / stats.count;
    const finalAngle = baseAngle + angleOffset;

    const proj = createProjectile(origin.x, origin.y, finalAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "STAB";
    (proj as any).stabCenter = origin;
    (proj as any).stabBaseDistance = 40; // 기본 거리 (꼬리에서 약간 떨어짐)
    (proj as any).stabRange = 60; // 찌르는 깊이
    (proj as any).orbitSpeed = orbitSpeed;
    (proj as any).currentPhase = 0; // 0 to 1
    (proj as any).duration = 300 / (stats.speed || 1); // 공속에 따라 찌르기 속도 증가 (duration 감소)

    // 초기 위치 설정
    proj.position.x = origin.x + Math.cos(finalAngle) * (proj as any).stabBaseDistance;
    proj.position.y = origin.y + Math.sin(finalAngle) * (proj as any).stabBaseDistance;
    proj.angle = finalAngle;

    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    (proj as any).hitInterval = stats.hitInterval || 200; // Pass Interval
    proj.penetration = 999;

    addProjectile(proj);
  }
};

const fireSwing = (origin: Vector2D, stats: any, type: any) => {
  // 휘두르기 (부채꼴)
  // 꼬리의 진행 방향 또는 가장 가까운 적 방향을 기준으로 휘두름
  const target = getNearestEnemy(origin);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2; // 적 없으면 랜덤 방향

  for (let i = 0; i < stats.count; i++) {
    // 여러 개일 경우 각도 분산
    const angleOffset = (i - (stats.count - 1) / 2) * (Math.PI / 2);
    const finalBaseAngle = baseAngle + angleOffset;

    const proj = createProjectile(origin.x, origin.y, finalBaseAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "SWING";
    (proj as any).swingCenter = origin;
    (proj as any).swingBaseAngle = finalBaseAngle;
    (proj as any).swingRange = Math.PI / 1.5; // 120도 휘두르기
    (proj as any).swingSpeed = (Math.PI / (stats.duration || 300)) * 1000; // duration 동안 swingRange 만큼 이동
    (proj as any).swingTime = 0;
    (proj as any).duration = stats.duration || 300;

    proj.damage = stats.damage;
    (proj as any).radius = stats.size;

    // 검은 관통 무한
    proj.penetration = 999;

    addProjectile(proj);
  }
};

const fireProjectile = (origin: Vector2D, stats: any, type: any, weaponId?: string) => {
  const nearby = spatialGrid.getNearbyEnemies(origin.x, origin.y, 600) as Enemy[];
  if (!nearby || nearby.length === 0) return;

  const targets = [...nearby]
    .filter(e => !e.isExpired)
    .sort((a, b) => {
      const distA = Math.pow(a.position.x - origin.x, 2) + Math.pow(a.position.y - origin.y, 2);
      const distB = Math.pow(b.position.x - origin.x, 2) + Math.pow(b.position.y - origin.y, 2);
      return distA - distB;
    });

  if (targets.length === 0) return;

  const isHoming = weaponId === "W02" || weaponId === "W02_EVO";

  for (let i = 0; i < stats.count; i++) {
    const target = targets[i % targets.length];
    const angle = Math.atan2(target.position.y - origin.y, target.position.x - origin.x);

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);

    if (isHoming) {
      (proj as any).behavior = "HOMING";
      (proj as any).turnSpeed = 6; // Radians per second
    }

    proj.damage = stats.damage;
    (proj as any).speed = stats.speed || 300;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 1;
    addProjectile(proj);
  }
};

const fireLine = (origin: Vector2D, stats: any, type: any) => {
  const target = getNearestEnemy(origin);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2;

  const spread = 0.1;
  for (let i = 0; i < stats.count; i++) {
    const angle = baseAngle + (i - (stats.count - 1) / 2) * spread;
    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    proj.damage = stats.damage;
    (proj as any).speed = stats.speed || 300;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 1;
    addProjectile(proj);
  }
};

const fireChain = (origin: Vector2D, stats: any, type: any) => {
  const target = getNearestEnemy(origin);
  if (!target) return;

  const angle = Math.atan2(target.position.y - origin.y, target.position.x - origin.x);
  const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
  proj.damage = stats.damage;
  (proj as any).speed = stats.speed || 300;
  (proj as any).radius = stats.size;
  proj.penetration = stats.pierce || 3;
  addProjectile(proj);
};

const fireOrbit = (origin: Vector2D, stats: any, type: any, ownerId?: string, weaponId?: string) => {
  // Guardian Orbit Logic (Persistent)
  let existingCount = 0;

  if (ownerId && weaponId) {
    const projectiles = getProjectiles() as any[];

    // 해당 무기 ID와 소유자를 가진 투사체 검색
    const existing = projectiles.filter(p => p.weaponId === weaponId && p.parentID === ownerId && !p.isExpired);
    existingCount = existing.length;

    if (existingCount > 0) {
      // 이미 존재하면 스탯 업데이트 & 갯수 맞추기
      existing.forEach((p, idx) => {
        if (idx < stats.count) {
          // Update Stats
          p.damage = stats.damage;
          p.radius = stats.size;
          (p as any).orbitSpeedBase = stats.speed || 1.5;
          (p as any).stabRange = stats.range || 50;

          // Update Speed Multiplier
          const speedMult = (stats.speed || 0.8) / 0.8;
          (p as any).speedMult = speedMult;
          (p as any).stabSpeed = 200 * speedMult;

          (p as any).hitInterval = stats.hitInterval || 200; // Update Hit Interval (Default 200)
          // 갯수가 충분하면 루프 계속
        } else {
          // 갯수가 줄었으면 초과분 제거
          p.isExpired = true;
        }
      });

      // 갯수가 모자라면 추가 생성해야 함
      if (existingCount >= stats.count) return;
    }
  }

  // 생성 (부족한 갯수만큼)
  const startIdx = existingCount;
  for (let i = startIdx; i < stats.count; i++) {
    // 360도 등분
    const angle = (Math.PI * 2 * i) / stats.count;

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "ORBIT_STAB"; // Using ORBIT_STAB behavior

    (proj as any).orbitAngle = angle;
    (proj as any).orbitRadiusBase = 30; // Drastically reduced to 25 (Very close to tail)
    (proj as any).orbitRadiusCurrent = 5;
    (proj as any).orbitSpeed = stats.speed || 1.5;

    (proj as any).stabRange = stats.range || 50; // Use Stat Range
    // Attack Speed 비례
    const speedMult = (stats.speed || 0.8) / 0.8;
    (proj as any).speedMult = speedMult; // Store for cooldown calculation
    (proj as any).stabSpeed = 200 * speedMult; // Increased base speed from 100 to 300

    (proj as any).triggerRange = 200;

    (proj as any).state = "ORBIT";

    // Persistent Setup
    if (ownerId && weaponId) {
      proj.parentID = ownerId; // Owner ID for linking
      proj.weaponId = weaponId;
      proj.duration = 9999999; // Persistent
      (proj as any).owner = { id: ownerId, position: origin }; // 초기 위치
    } else {
      // Fallback
      (proj as any).orbitCenter = origin;
      (proj as any).orbitRadiusBase = 25;
    }

    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    (proj as any).hitInterval = stats.hitInterval || 200; // Pass Interval
    proj.penetration = 999; // Infinite

    addProjectile(proj);
  }
};

const fireReturn = (origin: Vector2D, stats: any, type: any) => {
  const target = getNearestEnemy(origin);
  const angle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2;

  for (let i = 0; i < stats.count; i++) {
    const offsetAngle = angle + (i - (stats.count - 1) / 2) * 0.3;
    const proj = createProjectile(origin.x, origin.y, offsetAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "RETURN";
    (proj as any).returnDistance = 400;
    (proj as any).hasReturned = false;
    (proj as any).speed = stats.speed || 400;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    addProjectile(proj);
  }
};

const fireSpread = (origin: Vector2D, stats: any, type: any) => {
  const target = getNearestEnemy(origin);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2;

  const spreadAngle = Math.PI / 4; // 45도
  for (let i = 0; i < stats.count; i++) {
    const angle = baseAngle + (i - (stats.count - 1) / 2) * (spreadAngle / stats.count);
    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "LINEAR";
    (proj as any).speed = stats.speed || 320;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 1;
    addProjectile(proj);
  }
};

const fireLinear = (origin: Vector2D, stats: any, type: any) => {
  const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]; // 4방향

  for (let i = 0; i < stats.count; i++) {
    const angle = angles[i % 4] + (Math.random() - 0.5) * 0.2;
    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "LINEAR";
    (proj as any).speed = stats.speed || 400;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 2;
    addProjectile(proj);
  }
};

// Generic Spawn Area
const spawnArea = (origin: Vector2D, stats: any, type: any, behavior: AreaBehavior) => {
  // 타겟이 필요한 경우(원거리 소환) 처리
  let spawnPos = { ...origin };
  if (behavior === "STATIC" || behavior === "VORTEX") {
    const target = getNearestEnemy(origin);
    if (target) {
      spawnPos = { ...target.position };
    } else {
      spawnPos.x += (Math.random() - 0.5) * 200;
      spawnPos.y += (Math.random() - 0.5) * 200;
    }
  }

  for (let i = 0; i < stats.count; i++) {
    const offset = i === 0 ? { x: 0, y: 0 } : { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 };

    // Aura/Nova의 경우 플레이어 위치나 지정 위치 정확히
    if (behavior === "STATIC" && stats.count === 1) {
      // single burst
    } else {
      spawnPos.x += offset.x;
      spawnPos.y += offset.y;
    }

    const area = createArea(spawnPos.x, spawnPos.y, type, behavior, {
      damage: stats.damage,
      radius: stats.size,
      duration: stats.duration || 3000,
      tickRate: 200, // 0.2s default
    });

    // 특수 속성 설정
    if (behavior === "VORTEX") {
      area.vortexStrength = 300; // 끌어당기는 힘
    }
    if (behavior === "DRIFT") {
      area.driftSpeed = stats.speed || 50;
    }

    addProjectile(area as any);
  }
};

// Aura 특수 처리 (플레이어 추적)
const createAuraWeapon = (player: Player, stats: any, type: any) => {
  const area = createArea(player.position.x, player.position.y, type, "FOLLOW", {
    damage: stats.damage,
    radius: stats.size,
    duration: stats.duration || 999999,
    tickRate: stats.cooldown || 500, // 오라의 쿨타임 = 틱 간격
  });
  area.followTarget = player;
  addProjectile(area as any);
};

const getNearestEnemy = (origin: Vector2D): Enemy | null => {
  const enemies = getEnemies() as Enemy[];
  let nearest: Enemy | null = null;
  let minDistSq = Infinity;

  enemies.forEach(e => {
    if (e.isExpired) return;
    const dSq = Math.pow(e.position.x - origin.x, 2) + Math.pow(e.position.y - origin.y, 2);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      nearest = e;
    }
  });

  return nearest;
};
