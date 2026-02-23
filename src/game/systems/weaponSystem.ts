import { Player, ActiveWeapon, Scalar, Vector2D, Enemy, PassiveInstance, ElementType } from "@/game/types";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import { PASSIVE_REGISTRY } from "@/game/config/passiveRegistry";
import { addProjectile, addArea, getEnemies, getTail, getProjectiles } from "@/game/managers/state";
import { createProjectile } from "@/game/entities/projectile";
import { spatialGrid } from "@/game/managers/grid";
import { createArea, AreaBehavior } from "@/game/entities/area";
import { applyChainLightning } from "./combat";
import { VFXFactory } from "@/engine/vfx/VFXFactory";
import { addScore, addXPGem } from "@/game/managers/state";
import { damageTextManager } from "@/game/managers/damageTextManager";
import { waveManager } from "@/game/managers/waveManager";

// Local implementation of damage bonus logic
const getFlatDamageBonus = (player: Player): number => {
  let atkStat = player.stats.atk || 1.0;

  // 무력(Might) 패시브 체크 - 공격력 스탯에 합산
  const mightPassive = player.passives?.find(p => p.id === "P01");
  if (mightPassive) {
    const pDef = PASSIVE_REGISTRY["P01"];
    const pVal = pDef.levels[mightPassive.level]?.value || 0;
    atkStat += pVal;
  }

  // 1.0을 기준으로 0.1당 +1 데미지 (합연산)
  return (atkStat - 1.0) * 10;
};

export const updateWeapons = (player: Player, deltaTime: Scalar) => {
  player.activeWeapons.forEach(aw => {
    const def = WEAPON_REGISTRY[aw.id];
    if (!def) return;

    // Update timer
    aw.timer += deltaTime * 1000; // ms

    const stats = getEffectiveStats(player, aw);
    const interval = stats.attackSpeed > 0 ? 1000 / stats.attackSpeed : 999999;

    if (aw.timer >= interval) {
      aw.timer = 0;
      aw.lastFired = Date.now();
      triggerWeaponEffect(player, aw, stats);
    }
  });
};

export const getEffectiveStats = (player: Player, aw: ActiveWeapon) => {
  const def = WEAPON_REGISTRY[aw.id];
  let stats = { ...def.baseStats, currentLevel: aw.level };

  // 1. Level Scaling
  for (let lv = 2; lv <= aw.level; lv++) {
    const scale = def.levels[lv];
    if (scale) {
      if (scale.damage) stats.damage += scale.damage;
      if (scale.attackSpeed) stats.attackSpeed += scale.attackSpeed;
      if (scale.count) stats.count += scale.count;
      if (scale.size) stats.size += scale.size;
      if (scale.speed) stats.speed = (stats.speed || 0) + scale.speed;
      if (scale.pierce) stats.pierce = (stats.pierce || 0) + scale.pierce;
      if (scale.range) stats.range = (stats.range || 0) + scale.range;
      if (scale.orbitRadiusBase) stats.orbitRadiusBase = (stats.orbitRadiusBase || 0) + scale.orbitRadiusBase;
      if (scale.triggerRange) stats.triggerRange = (stats.triggerRange || 0) + scale.triggerRange;
      if (scale.aggroSpeedMultiplier)
        stats.aggroSpeedMultiplier = (stats.aggroSpeedMultiplier || 0) + scale.aggroSpeedMultiplier;
      if (scale.burnDamage) stats.burnDamage = (stats.burnDamage || 0) + scale.burnDamage;
      if (scale.burnDuration) stats.burnDuration = (stats.burnDuration || 0) + scale.burnDuration;
      if (scale.explosionRadius) stats.explosionRadius = (stats.explosionRadius || 0) + scale.explosionRadius;
      if (scale.chainCount) stats.chainCount = (stats.chainCount || 0) + scale.chainCount;
      if (scale.chainRange) stats.chainRange = (stats.chainRange || 0) + scale.chainRange;
      if (scale.freezeDuration) stats.freezeDuration = (stats.freezeDuration || 0) + scale.freezeDuration;
      if (scale.chillAmount) stats.chillAmount = (stats.chillAmount || 0) + scale.chillAmount;
      if (scale.chillDuration) stats.chillDuration = (stats.chillDuration || 0) + scale.chillDuration;
    }
  }

  // 2. Passive Scaling
  player.passives.forEach((p: PassiveInstance) => {
    const pDef = PASSIVE_REGISTRY[p.id];
    if (!pDef) return;
    const pVal = pDef.levels[p.level]?.value || 0;

    switch (p.id) {
      case "P01": // Might (Damage)
        // Handled below by getGlobalDamageMultiplier for additive scaling
        break;
      case "P02": // Attack Speed Increase (Cooldown Reduction)
        // pVal is negative (e.g. -0.1 for 10% cooldown reduction)
        // Cooldown * (1 + pVal) -> AttackSpeed * (1 / (1 + pVal))
        if (1 + pVal > 0) {
          stats.attackSpeed *= 1 / (1 + pVal);
        }
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
  // 3. Player Base Stats Scaling (FireRate / Speed)
  // 3. Player Base Stats Scaling
  stats.attackSpeed *= player.stats.fireRate || 1.0;
  // Cooldown Reduction (Increase Attack Speed)
  if (player.stats.cooldown) {
    stats.attackSpeed *= 1 + player.stats.cooldown;
  }

  // Projectile Speed
  if (stats.speed) stats.speed *= player.stats.projectileSpeed || 1.0;

  // Area / Size / Range
  const areaMult = player.stats.area || 1.0;
  stats.size *= areaMult;
  if (stats.range) stats.range *= areaMult;
  if (stats.explosionRadius) stats.explosionRadius *= areaMult; // 폭발 범위도 적용

  // Duration
  if (stats.duration) stats.duration *= player.stats.duration || 1.0;
  if (stats.burnDuration) stats.burnDuration *= player.stats.duration || 1.0;
  if (stats.freezeDuration) stats.freezeDuration *= player.stats.duration || 1.0;
  if (stats.chillDuration) stats.chillDuration *= player.stats.duration || 1.0;

  // Amount (Additional Projectiles)
  if (stats.count) stats.count += player.stats.amount || 0;

  // 4. Unified Damage Scaling (Player ATK Stat + Might Passive, Additive Flat Bonus)
  const damageBonus = getFlatDamageBonus(player);
  stats.damage += damageBonus;

  stats.attackSpeed = Math.max(0, stats.attackSpeed);
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
      fireProjectile(player, origin, stats, def.tags[0], segments, aw.id);
      break;
    case "line":
      fireLine(player, origin, stats, def.tags[0]);
      break;
    case "chain":
      fireChain(player, origin, stats);
      break;
    case "area":
      // 시작하자마자 허공에 던지는 것 방지
      if (waveManager.getPlayTime() > 0.1) {
        spawnArea(player, origin, stats, def.tags[0], "STATIC");
      }
      break;
    case "orbit":
      fireOrbit(player, origin, stats, def.tags[0], ownerId, aw.id);
      break;
    case "return":
      fireReturn(origin, stats, def.tags[0]);
      break;
    case "spread":
      fireSpread(player, origin, stats, def.tags[0]);
      break;
    case "linear":
      fireLinear(player, origin, stats, def.tags[0]);
      break;
    case "nova":
      spawnArea(player, player.position, stats, def.tags[0], "STATIC"); // 플레이어 위치 중심 폭발
      break;
    case "aura":
      createAuraWeapon(player, stats, def.tags[0]);
      break;
    case "vortex":
      fireGravityOrb(player, origin, stats, def.tags[0]);
      break;
    case "gas":
      spawnArea(player, origin, stats, def.tags[0], "DRIFT");
      break;
    case "trap":
      spawnArea(player, origin, stats, def.tags[0], "TRAP");
      break;
    case "swing":
      fireSwing(player, origin, stats, def.tags[0]);
      break;
    case "stab":
      fireStab(player, origin, stats, def.tags[0], ownerId, aw.id);
      break;
    case "beam":
      fireBeam(player, origin, stats, def.tags[0], ownerId);
      break;
    case "bat":
      fireBat(player, origin, stats, def.tags[0], ownerId);
      break;
    case "arc":
      fireArc(player, origin, stats, def.tags[0], ownerId, aw.id);
      break;
    case "bounce":
      fireChakram(player, origin, stats, def.tags[0]);
      break;
    case "flame":
      fireFlame(player, origin, stats, def.tags[0], ownerId);
      break;
    case "sky":
      fireSky(player, origin, stats);
      break;
    case "nuke":
      spawnArea(player, origin, stats, def.tags[0], "STATIC");
      break;
  }
};

const fireBat = (_player: Player, origin: Vector2D, stats: any, type: any, ownerId?: string) => {
  for (let i = 0; i < stats.count; i++) {
    // 플레이어 주변에서 랜덤한 위치에 생성
    const angle = Math.random() * Math.PI * 2;
    const offset = 30; // 플레이어로부터 거리
    const x = origin.x + Math.cos(angle) * offset;
    const y = origin.y + Math.sin(angle) * offset;

    // 초기 진행 방향 (랜덤)
    const moveAngle = Math.random() * Math.PI * 2;

    const proj = createProjectile(x, y, moveAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "BAT";
    (proj as any).ownerId = ownerId;
    (proj as any).speed = stats.speed || 150;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = 1; // 1명만 공격하고 사라짐
    (proj as any).duration = stats.duration || 5000;
    (proj as any).lifeSteal = stats.lifeSteal || 0;

    // 웨이브 모션을 위한 초기 오프셋
    (proj as any).waveOffset = Math.random() * Math.PI * 2;

    addProjectile(proj);
  }
};

const fireArc = (_player: Player, origin: Vector2D, stats: any, type: any, ownerId?: string, weaponId?: string) => {
  // 타겟팅: 가장 가까운 적 방향 (X축)
  const enemies = getEnemies() as Enemy[];
  let nearestX = 0;
  let minDistSq = Infinity;

  enemies.forEach(e => {
    if (e.isExpired) return;
    const dSq = Math.pow(e.position.x - origin.x, 2) + Math.pow(e.position.y - origin.y, 2);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      nearestX = e.position.x;
    }
  });

  // 적이 없으면 랜덤 방향, 있으면 적 방향
  const dirX = minDistSq !== Infinity ? (nearestX > origin.x ? 1 : -1) : Math.random() > 0.5 ? 1 : -1;
  const baseAngle = dirX > 0 ? -Math.PI / 4 : (-3 * Math.PI) / 4; // -45도 or -135도

  for (let i = 0; i < stats.count; i++) {
    const spread = stats.count > 1 ? (i - (stats.count - 1) / 2) * 0.2 : 0;
    const angle = baseAngle + spread + (Math.random() - 0.5) * 0.1;

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "ARC";
    (proj as any).ownerId = ownerId;
    (proj as any).weaponId = weaponId;

    // Physics
    const speed = (stats.speed || 180) * 2.5; // 속도 증가
    (proj as any).vx = Math.cos(angle) * speed;
    (proj as any).vy = Math.sin(angle) * speed;
    (proj as any).gravity = 400; // 중력 감소

    (proj as any).visualAngle = 0;
    (proj as any).rotationSpeed = 10 * dirX; // 회전 속도

    proj.damage = stats.damage;
    proj.penetration = stats.pierce || 1;
    (proj as any).radius = stats.size;
    (proj as any).duration = 5000;

    addProjectile(proj);
  }
};

const fireStab = (_player: Player, origin: Vector2D, stats: any, type: any, _ownerId?: string, _weaponId?: string) => {
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

const fireSwing = (_player: Player, origin: Vector2D, stats: any, type: any) => {
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

const fireProjectile = (
  _player: Player,
  origin: Vector2D,
  stats: any,
  type: any,
  segments: any[],
  weaponId?: string,
) => {
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
    // 여러 세그먼트가 있으면 순차적으로 발사 지점 선택
    const currentSegment = segments[i % segments.length] || segments[0];
    const currentOrigin = currentSegment ? currentSegment.position : origin;
    const target = targets[i % targets.length];
    const angle = Math.atan2(target.position.y - currentOrigin.y, target.position.x - currentOrigin.x);

    const proj = createProjectile(currentOrigin.x, currentOrigin.y, angle, type, 1, "PROJECTILE" as any);

    if (isHoming) {
      (proj as any).behavior = "HOMING";
      (proj as any).turnSpeed = 8; // 회전 속도 상향 (6 -> 8)
    }

    proj.damage = stats.damage;
    (proj as any).speed = stats.speed || 300;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 1;
    (proj as any).hitInterval = 250;
    (proj as any).burnDamage = stats.burnDamage;
    (proj as any).burnDuration = stats.burnDuration;
    (proj as any).range = stats.range || 800; // 사거리 전달 (기본 800)
    (proj as any).explosionRadius = stats.explosionRadius || 0; // 폭발 반경 전달
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    (proj as any).weaponId = weaponId; // 무기 ID 전달

    // 도끼인 경우 회전 속도 및 틱 데미지 설정
    if (weaponId === "W12") {
      (proj as any).rotationSpeed = 10;
      (proj as any).visualAngle = 0;
      (proj as any).hitInterval = 100; // 틱 데미지 간격을 짧게 (적과 붙으면 여러 번 타격)
    }

    addProjectile(proj);
  }
};

const fireLine = (_player: Player, origin: Vector2D, stats: any, type: any) => {
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
    (proj as any).hitInterval = 200;
    (proj as any).burnDamage = stats.burnDamage;
    (proj as any).burnDuration = stats.burnDuration;
    (proj as any).range = stats.range || 800; // 사거리 전달 (기본 800)
    (proj as any).explosionRadius = stats.explosionRadius || 0; // 폭발 반경 전달
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    addProjectile(proj);
  }
};

// ==========================================
// [Chain Lightning] - Instant Hit Logic
// ==========================================
const fireChain = (_player: Player, origin: Vector2D, stats: any) => {
  const range = stats.range || 400;
  const nearby = spatialGrid.getNearbyEnemies(origin.x, origin.y, range) as Enemy[];
  if (!nearby || nearby.length === 0) return;

  const targets = [...nearby]
    .filter(e => !e.isExpired && e.hp > 0)
    .sort((a, b) => {
      const distA = Math.pow(a.position.x - origin.x, 2) + Math.pow(a.position.y - origin.y, 2);
      const distB = Math.pow(b.position.x - origin.x, 2) + Math.pow(b.position.y - origin.y, 2);
      return distA - distB;
    });

  for (let i = 0; i < stats.count; i++) {
    const target = targets[i % targets.length];
    if (!target) break;

    // 1. 첫 번째 타격 (즉시 데미지)
    const finalDamage = stats.damage;
    target.hp -= finalDamage;
    damageTextManager.show(target.position.x, target.position.y, Math.floor(finalDamage), false);

    // 2. 번개 시각 효과 생성 (발사 지점에서 첫 적까지)
    VFXFactory.createLightningChain(origin.x, origin.y, target.position.x, target.position.y);

    // 3. 첫 적 처치 체크 (폭발 제거)
    if (target.hp <= 0) {
      target.isExpired = true;
      addScore(50);
      addXPGem(target.position.x, target.position.y, 2);
    }

    // 4. 전이 시작
    const chainCount = stats.chainCount || 3;
    const chainRange = stats.chainRange || 150;
    applyChainLightning(target, stats.damage, chainCount, chainRange, [target.id]);
  }
};

const fireSky = (player: Player, _origin: Vector2D, stats: any) => {
  const range = 900;
  const nearby = spatialGrid.getNearbyEnemies(player.position.x, player.position.y, range) as Enemy[];
  const validEnemies = nearby.filter(e => !e.isExpired && e.hp > 0);

  const count = stats.count || 1;
  const positions: { x: number; y: number; target?: Enemy }[] = [];

  if (validEnemies.length > 0) {
    const sortedByDistance = [...validEnemies].sort((a, b) => {
      const dA = Math.pow(a.position.x - player.position.x, 2) + Math.pow(a.position.y - player.position.y, 2);
      const dB = Math.pow(b.position.x - player.position.x, 2) + Math.pow(b.position.y - player.position.y, 2);
      return dA - dB;
    });

    const strikeCount = Math.min(count, sortedByDistance.length);
    for (let i = 0; i < strikeCount; i++) {
      const target = sortedByDistance[i];
      positions.push({ x: target.position.x, y: target.position.y, target });
    }
  } else {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 400;
      positions.push({
        x: player.position.x + Math.cos(angle) * dist,
        y: player.position.y + Math.sin(angle) * dist,
      });
    }
  }

  positions.forEach(pos => {
    VFXFactory.createThunderStrike(pos.x, pos.y);

    const explosionRadius = stats.explosionRadius || 40;
    const targets = spatialGrid.getNearbyEnemies(pos.x, pos.y, explosionRadius);

    targets.forEach(e => {
      if (e.isExpired || e.hp <= 0) return;

      let dmg = stats.damage;
      const def = (e as any).defense || 0;
      dmg = Math.max(1, dmg - def);

      e.hp -= dmg;
      damageTextManager.show(e.position.x, e.position.y, Math.floor(dmg), dmg > stats.damage * 1.5);

      if (e.hp <= 0) {
        e.isExpired = true;
        addScore(50);
        addXPGem(e.position.x, e.position.y, 1);
      }
    });
  });
};

const fireOrbit = (player: Player, origin: Vector2D, stats: any, type: any, ownerId?: string, weaponId?: string) => {
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
          (p as any).orbitSpeedBase = stats.speed || 0.7;
          (p as any).stabRange = stats.range || 40;
          (p as any).orbitRadiusBase = stats.orbitRadiusBase !== undefined ? stats.orbitRadiusBase : 36;
          (p as any).triggerRange = stats.triggerRange; // 기본값 제거
          (p as any).slotIndex = idx;
          (p as any).slotTotal = stats.count;
          (p as any).currentLevel = stats.currentLevel;

          // Update Speed Multiplier
          const speedFactor = (stats.speed || 0.7) / 0.7;
          const aggroFactor = stats.aggroSpeedMultiplier || 1.6;
          const speedMult = speedFactor * aggroFactor * player.stats.fireRate;
          (p as any).speedMult = speedMult;
          (p as any).stabSpeed = 200 * speedMult;

          (p as any).hitInterval = (stats.hitInterval || 200) / player.stats.fireRate; // Update Hit Interval (Faster speed = more hits)
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
    // behavior 결정
    const isStab = stats.range && stats.range > 0; // 사거리가 있으면 찌르기 (W01)
    const behavior = isStab ? "ORBIT_STAB" : "ORBIT";
    (proj as any).behavior = behavior;

    (proj as any).orbitAngle = angle;
    (proj as any).orbitRadiusBase = stats.orbitRadiusBase !== undefined ? stats.orbitRadiusBase : 36;
    (proj as any).orbitRadiusCurrent = (proj as any).orbitRadiusBase;
    (proj as any).orbitSpeed = stats.speed || 0.7;
    // W08용 추가 속성
    (proj as any).orbitSpeedBase = stats.speed || 0.7;
    (proj as any).orbitSpeedAggro = stats.orbitSpeedAggro || 3.0;

    (proj as any).stabRange = stats.range || 40; // Use Stat Range
    (proj as any).slotIndex = i;
    (proj as any).slotTotal = stats.count;
    (proj as any).currentLevel = stats.currentLevel;

    // Attack Speed 비례
    const speedFactor = (stats.speed || 0.7) / 0.7;
    const aggroFactor = stats.aggroSpeedMultiplier || 1.6;
    const speedMult = speedFactor * aggroFactor * (player?.stats.fireRate || 1);
    (proj as any).speedMult = speedMult;
    (proj as any).stabSpeed = 200 * speedMult;

    (proj as any).triggerRange = stats.triggerRange; // 기본값 제거

    (proj as any).state = "ORBIT"; // 초기 상태

    (proj as any).hitInterval = stats.hitInterval || 200; // 타격 간격

    // Owner ID Link
    if (ownerId && weaponId) {
      proj.parentID = ownerId;
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
  // Check if any boomerangs are still active (not returned yet)
  const activeBoomerangs = getProjectiles().filter(
    p => (p as any).behavior === "RETURN" && !(p as any).hasFullyReturned,
  );

  // Don't fire new boomerangs if any are still out
  if (activeBoomerangs.length > 0) {
    return;
  }

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
    (proj as any).hasFullyReturned = false; // Track when it's fully back
    (proj as any).speed = stats.speed || 400;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 1; // 기본 관통 1, 부메랑은 999
    (proj as any).hitInterval = 150; // 다단 히트 간격 설정
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    addProjectile(proj);
  }
};

const fireSpread = (_player: Player, origin: Vector2D, stats: any, type: any) => {
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
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    addProjectile(proj);
  }
};

const fireLinear = (_player: Player, origin: Vector2D, stats: any, type: any) => {
  const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]; // 4방향

  for (let i = 0; i < stats.count; i++) {
    const angle = angles[i % 4] + (Math.random() - 0.5) * 0.2;
    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "LINEAR";
    (proj as any).speed = stats.speed || 400;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 2;
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    addProjectile(proj);
  }
};

const fireBeam = (_player: Player, origin: Vector2D, stats: any, type: any, ownerId?: string) => {
  // 가장 가까운 적 찾기
  const target = getNearestEnemy(origin);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2; // 적 없으면 랜덤 방향

  const spread = 0.3; // 레이저 간 각도 분산
  for (let i = 0; i < stats.count; i++) {
    const angle = baseAngle + (i - (stats.count - 1) / 2) * spread;
    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "BEAM"; // 레이저 빔 behavior
    (proj as any).ownerId = ownerId; // 소유자 ID 저장 (꼬리 등)
    (proj as any).speed = 0; // 레이저는 움직이지 않음
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 999; // 무한 관통
    (proj as any).range = stats.range || 1000; // 레이저 길이
    (proj as any).duration = stats.duration || 2000; // 지속 시간
    (proj as any).hitInterval = 2000; // 한 번만 타격
    addProjectile(proj);
  }
};

// Generic Spawn Area
const spawnArea = (_player: Player, origin: Vector2D, stats: any, type: any, behavior: AreaBehavior) => {
  // Poison Bottle 던지는 연출 (POISON 타입 + STATIC 장판 전용)
  if (type === ElementType.POISON && behavior === "STATIC") {
    const weaponRange = stats.range || 300;
    const target = getNearestEnemy(origin, weaponRange);

    // 적이 없으면 아예 던지지 않음 (허공 투척 버그 방지)
    if (!target) return;

    for (let i = 0; i < stats.count; i++) {
      let finalPos = { ...target.position };

      // 여러 개를 던질 경우 흩어짐 효과
      if (i > 0) {
        finalPos.x += (Math.random() - 0.5) * 150;
        finalPos.y += (Math.random() - 0.5) * 150;
      }

      const proj = createProjectile(origin.x, origin.y, 0, type, 1, "PROJECTILE" as any);
      (proj as any).behavior = "BOTTLE";
      (proj as any).targetPos = finalPos; // 최초 타겟 지점 고정
      (proj as any).startPos = { ...origin };
      (proj as any).speed = stats.speed || 200; // 레지스트리 스탯 사용 (기본 200으로 하향)
      (proj as any).areaStats = {
        damage: stats.damage,
        radius: stats.size,
        duration: stats.duration || 3000,
        tickRate: 200,
        chillAmount: stats.chillAmount,
        chillDuration: stats.chillDuration,
        freezeDuration: stats.freezeDuration,
      };
      addProjectile(proj);
    }
    return;
  }

  // 타겟이 필요한 경우(원거리 소환) 처리
  let spawnPos = { ...origin };
  if (behavior === "STATIC" || behavior === "VORTEX") {
    const weaponRange = stats.range || 300;
    const target = getNearestEnemy(origin, weaponRange);
    if (target) {
      spawnPos = { ...target.position };
    } else {
      // 일반 소환의 경우 적이 없으면 주변 랜덤 위치 (병 던지기 말고 일반 마법)
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
      chillAmount: stats.chillAmount,
      chillDuration: stats.chillDuration,
      freezeDuration: stats.freezeDuration,
    });

    // 특수 속성 설정
    if (behavior === "VORTEX") {
      area.vortexStrength = 200 + stats.damage * 5; // 데미지에 비례하여 끌어당기는 힘 증가
    }
    if (behavior === "DRIFT") {
      area.driftSpeed = stats.speed || 50;
    }

    addArea(area);
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
  addArea(area);
};

// ==========================================
// [CHAKRAM] - 적 간 튕기는 차크람 발사
// ==========================================
const fireChakram = (_player: Player, origin: Vector2D, stats: any, type: any) => {
  for (let i = 0; i < stats.count; i++) {
    const target = getNearestEnemy(origin, 600);
    const angle = target
      ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
      : Math.random() * Math.PI * 2;

    // 여러 개 발사 시 각도 분산
    const spread = stats.count > 1 ? Math.PI / 4 : 0;
    const startAngle = stats.count > 1 ? angle - spread / 2 : angle;
    const step = stats.count > 1 ? spread / (stats.count - 1) : 0;
    const finalAngle = startAngle + step * i;

    const proj = createProjectile(origin.x, origin.y, finalAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "CHAKRAM";
    (proj as any).speed = stats.speed || 280;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size || 16;
    proj.penetration = stats.pierce || 5; // 튕김 횟수 = pierce
    (proj as any).bounceRange = 300; // 튕길 때 다음 적 탐색 범위
    (proj as any).hitEnemyIds = []; // 이미 맞은 적 추적 (같은 튕김 체인에서 중복 방지)

    addProjectile(proj);
  }
};

// ==========================================
// [FLAME] - 화염 방사 (Area 방식)
// ==========================================
const fireFlame = (player: Player, origin: Vector2D, stats: any, type: any, ownerId?: string) => {
  // 1. 발사 위치 보정 (꼬리에서 발사)
  let sourceEntity: any = player;
  let firePos = { ...origin };

  if (ownerId) {
    const tail = getTail().find(t => t.id === ownerId);
    if (tail) {
      sourceEntity = tail;
      firePos = { x: tail.position.x, y: tail.position.y };
    }
  }

  // 2. 타겟팅: 가장 가까운 적을 찾음
  const target = getNearestEnemy(firePos, 400);

  // 적이 없으면 발사하지 않음
  if (!target) return;

  const aimAngle = Math.atan2(target.position.y - firePos.y, target.position.x - firePos.x);

  // 3. 공격 속도에 따른 틱 설정 & 확산 각도
  const tickRate = 100;
  const spread = Math.PI / 6;

  const area = createArea(firePos.x, firePos.y, type, "FLAME_CONE", {
    damage: stats.damage,
    radius: stats.size || 250,
    duration: stats.duration || 800,
    tickRate: tickRate,
    coneSpread: spread,
    chillAmount: 0,
  });

  // 방향 적용
  area.coneAngle = aimAngle;

  // 따라다닐 대상 설정 (꼬리 또는 플레이어)
  area.followTarget = sourceEntity;

  addArea(area);
};

// ==========================================
// [GRAVITY ORB] - 느린 투사체 발사 → 적중 시 블랙홀 생성
// ==========================================
const fireGravityOrb = (_player: Player, origin: Vector2D, stats: any, type: any) => {
  const target = getNearestEnemy(origin, 500);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2;

  // 부채꼴 발사 (Spread)
  const arc = Math.PI / 6; // 30도 범위 내에서 발사
  const startAngle = stats.count > 1 ? baseAngle - arc / 2 : baseAngle;
  const stepAngle = stats.count > 1 ? arc / (stats.count - 1) : 0;

  for (let i = 0; i < stats.count; i++) {
    const angle = startAngle + stepAngle * i;

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "GRAVITY_ORB";
    (proj as any).speed = stats.speed || 120;
    proj.damage = stats.damage;
    (proj as any).radius = 12; // 투사체 자체 크기
    proj.penetration = 1; // 첫 번째 적과 충돌 시 블랙홀 생성
    (proj as any).maxRange = 400; // 최대 사거리
    (proj as any).distanceTraveled = 0;

    // 블랙홀 장판 생성용 스탯
    (proj as any).areaStats = {
      damage: stats.damage,
      radius: stats.size,
      duration: stats.duration || 3000,
      tickRate: 500,
    };
    (proj as any).vortexStrength = 150 + stats.damage * 3; // 끌어당기는 힘 하향 조정

    addProjectile(proj);
  }
};

const getNearestEnemy = (origin: Vector2D, maxRange: number = Infinity): Enemy | null => {
  const enemies = getEnemies() as Enemy[];
  let nearest: Enemy | null = null;
  let minDistSq = maxRange * maxRange;

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
