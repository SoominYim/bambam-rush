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


const getFlatDamageBonus = (player: Player): number => {
  let atkStat = player.stats.atk || 1.0;

  
  const mightPassive = player.passives?.find(p => p.id === "P01");
  if (mightPassive) {
    const pDef = PASSIVE_REGISTRY["P01"];
    const pVal = pDef.levels[mightPassive.level]?.value || 0;
    atkStat += pVal;
  }

  
  return (atkStat - 1.0) * 10;
};

export const updateWeapons = (player: Player, deltaTime: Scalar) => {
  player.activeWeapons.forEach(aw => {
    const def = WEAPON_REGISTRY[aw.id];
    if (!def) return;

    
    aw.timer += deltaTime * 1000; 

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

  
  player.passives.forEach((p: PassiveInstance) => {
    const pDef = PASSIVE_REGISTRY[p.id];
    if (!pDef) return;
    const pVal = pDef.levels[p.level]?.value || 0;

    switch (p.id) {
      case "P01": 
        
        break;
      case "P02": 
        
        
        if (1 + pVal > 0) {
          stats.attackSpeed *= 1 / (1 + pVal);
        }
        break;
      case "P05": 
        stats.speed = (stats.speed || 0) * (1 + pVal);
        break;
      case "P06": 
        if (stats.duration) stats.duration *= 1 + pVal;
        break;
      case "P13": 
        stats.count += pVal;
        break;
      case "P04": 
        stats.size *= 1 + pVal;
        if (stats.range) stats.range *= 1 + pVal;
        break;
    }
  });
  
  
  stats.attackSpeed *= player.stats.fireRate || 1.0;
  
  if (player.stats.cooldown) {
    stats.attackSpeed *= 1 + player.stats.cooldown;
  }

  
  if (stats.speed) stats.speed *= player.stats.projectileSpeed || 1.0;

  
  const areaMult = player.stats.area || 1.0;
  stats.size *= areaMult;
  if (stats.range) stats.range *= areaMult;
  if (stats.explosionRadius) stats.explosionRadius *= areaMult; 

  
  if (stats.duration) stats.duration *= player.stats.duration || 1.0;
  if (stats.burnDuration) stats.burnDuration *= player.stats.duration || 1.0;
  if (stats.freezeDuration) stats.freezeDuration *= player.stats.duration || 1.0;
  if (stats.chillDuration) stats.chillDuration *= player.stats.duration || 1.0;

  
  if (stats.count) stats.count += player.stats.amount || 0;

  
  const damageBonus = getFlatDamageBonus(player);
  stats.damage += damageBonus;

  stats.attackSpeed = Math.max(0, stats.attackSpeed);
  return stats;
};

const triggerWeaponEffect = (player: Player, aw: ActiveWeapon, stats: any) => {
  const def = WEAPON_REGISTRY[aw.id];
  const segments = getTail().filter(s => s.weaponId === aw.id);
  const origin = segments.length > 0 ? segments[0].position : player.position;

  
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
      fireSpread(player, origin, stats, def.tags[0], aw.id);
      break;
    case "linear":
      fireLinear(player, origin, stats, def.tags[0]);
      break;
    case "nova":
      spawnArea(player, player.position, stats, def.tags[0], "STATIC"); 
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
    
    const angle = Math.random() * Math.PI * 2;
    const offset = 30; 
    const x = origin.x + Math.cos(angle) * offset;
    const y = origin.y + Math.sin(angle) * offset;

    
    const moveAngle = Math.random() * Math.PI * 2;

    const proj = createProjectile(x, y, moveAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "BAT";
    (proj as any).ownerId = ownerId;
    (proj as any).speed = stats.speed || 150;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = 1; 
    (proj as any).duration = stats.duration || 5000;
    (proj as any).lifeSteal = stats.lifeSteal || 0;

    
    (proj as any).waveOffset = Math.random() * Math.PI * 2;

    addProjectile(proj);
  }
};

const fireArc = (_player: Player, origin: Vector2D, stats: any, type: any, ownerId?: string, weaponId?: string) => {
  
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

  
  const dirX = minDistSq !== Infinity ? (nearestX > origin.x ? 1 : -1) : Math.random() > 0.5 ? 1 : -1;
  const baseAngle = dirX > 0 ? -Math.PI / 4 : (-3 * Math.PI) / 4; 

  for (let i = 0; i < stats.count; i++) {
    const spread = stats.count > 1 ? (i - (stats.count - 1) / 2) * 0.2 : 0;
    const angle = baseAngle + spread + (Math.random() - 0.5) * 0.1;

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "ARC";
    (proj as any).ownerId = ownerId;
    (proj as any).weaponId = weaponId;

    
    const speed = (stats.speed || 180) * 2.5; 
    (proj as any).vx = Math.cos(angle) * speed;
    (proj as any).vy = Math.sin(angle) * speed;
    (proj as any).gravity = 400; 

    (proj as any).visualAngle = 0;
    (proj as any).rotationSpeed = 10 * dirX; 

    proj.damage = stats.damage;
    proj.penetration = stats.pierce || 1;
    (proj as any).radius = stats.size;
    (proj as any).duration = 5000;

    addProjectile(proj);
  }
};

const fireStab = (_player: Player, origin: Vector2D, stats: any, type: any, _ownerId?: string, _weaponId?: string) => {
  
  
  
  const now = Date.now();
  const orbitSpeed = 1.0; 
  const baseAngle = (now / 1000) * orbitSpeed;

  for (let i = 0; i < stats.count; i++) {
    
    const angleOffset = (Math.PI * 2 * i) / stats.count;
    const finalAngle = baseAngle + angleOffset;

    const proj = createProjectile(origin.x, origin.y, finalAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "STAB";
    (proj as any).stabCenter = origin;
    (proj as any).stabBaseDistance = 40; 
    (proj as any).stabRange = 60; 
    (proj as any).orbitSpeed = orbitSpeed;
    (proj as any).currentPhase = 0; 
    (proj as any).duration = 300 / (stats.speed || 1); 

    
    proj.position.x = origin.x + Math.cos(finalAngle) * (proj as any).stabBaseDistance;
    proj.position.y = origin.y + Math.sin(finalAngle) * (proj as any).stabBaseDistance;
    proj.angle = finalAngle;

    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    (proj as any).hitInterval = stats.hitInterval || 200; 
    proj.penetration = 999;

    addProjectile(proj);
  }
};

const fireSwing = (_player: Player, origin: Vector2D, stats: any, type: any) => {
  
  
  const target = getNearestEnemy(origin);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2; 

  for (let i = 0; i < stats.count; i++) {
    
    const angleOffset = (i - (stats.count - 1) / 2) * (Math.PI / 2);
    const finalBaseAngle = baseAngle + angleOffset;

    const proj = createProjectile(origin.x, origin.y, finalBaseAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "SWING";
    (proj as any).swingCenter = origin;
    (proj as any).swingBaseAngle = finalBaseAngle;
    (proj as any).swingRange = Math.PI / 1.5; 
    (proj as any).swingSpeed = (Math.PI / (stats.duration || 300)) * 1000; 
    (proj as any).swingTime = 0;
    (proj as any).duration = stats.duration || 300;

    proj.damage = stats.damage;
    (proj as any).radius = stats.size;

    
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
    
    const currentSegment = segments[i % segments.length] || segments[0];
    const currentOrigin = currentSegment ? currentSegment.position : origin;
    const target = targets[i % targets.length];
    const angle = Math.atan2(target.position.y - currentOrigin.y, target.position.x - currentOrigin.x);

    const proj = createProjectile(currentOrigin.x, currentOrigin.y, angle, type, 1, "PROJECTILE" as any);

    if (isHoming) {
      (proj as any).behavior = "HOMING";
      (proj as any).turnSpeed = 8; 
    }

    proj.damage = stats.damage;
    (proj as any).speed = stats.speed || 300;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 1;
    (proj as any).hitInterval = 250;
    (proj as any).burnDamage = stats.burnDamage;
    (proj as any).burnDuration = stats.burnDuration;
    (proj as any).range = stats.range || 800; 
    (proj as any).explosionRadius = stats.explosionRadius || 0; 
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    (proj as any).weaponId = weaponId; 

    
    if (weaponId === "W12") {
      (proj as any).rotationSpeed = 10;
      (proj as any).visualAngle = 0;
      (proj as any).hitInterval = 100; 
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
    (proj as any).range = stats.range || 800; 
    (proj as any).explosionRadius = stats.explosionRadius || 0; 
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    addProjectile(proj);
  }
};




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

    
    const finalDamage = stats.damage;
    target.hp -= finalDamage;
    damageTextManager.show(target.position.x, target.position.y, Math.floor(finalDamage), false);

    
    VFXFactory.createLightningChain(origin.x, origin.y, target.position.x, target.position.y);

    
    if (target.hp <= 0) {
      target.isExpired = true;
      addScore(50);
      addXPGem(target.position.x, target.position.y, 2);
    }

    
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
  const hitEnemyIds = new Set<string>();

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
      if (hitEnemyIds.has(e.id)) return;

      let dmg = stats.damage;
      const def = (e as any).defense || 0;
      dmg = Math.max(1, dmg - def);

      e.hp -= dmg;
      hitEnemyIds.add(e.id);
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
  
  let existingCount = 0;

  if (ownerId && weaponId) {
    const projectiles = getProjectiles() as any[];

    
    const existing = projectiles.filter(p => p.weaponId === weaponId && p.parentID === ownerId && !p.isExpired);
    existingCount = existing.length;

    if (existingCount > 0) {
      
      existing.forEach((p, idx) => {
        if (idx < stats.count) {
          
          p.damage = stats.damage;
          p.radius = stats.size;
          (p as any).orbitSpeedBase = stats.speed || 0.7;
          (p as any).stabRange = stats.range || 40;
          (p as any).orbitRadiusBase = stats.orbitRadiusBase !== undefined ? stats.orbitRadiusBase : 36;
          (p as any).triggerRange = stats.triggerRange; 
          (p as any).slotIndex = idx;
          (p as any).slotTotal = stats.count;
          (p as any).currentLevel = stats.currentLevel;

          
          const speedFactor = (stats.speed || 0.7) / 0.7;
          const aggroFactor = stats.aggroSpeedMultiplier || 1.6;
          const speedMult = speedFactor * aggroFactor * player.stats.fireRate;
          (p as any).speedMult = speedMult;
          (p as any).stabSpeed = 200 * speedMult;

          (p as any).hitInterval = (stats.hitInterval || 200) / player.stats.fireRate; 
          
        } else {
          
          p.isExpired = true;
        }
      });

      
      if (existingCount >= stats.count) return;
    }
  }

  
  const startIdx = existingCount;
  for (let i = startIdx; i < stats.count; i++) {
    
    const angle = (Math.PI * 2 * i) / stats.count;

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    
    const isStab = stats.range && stats.range > 0; 
    const behavior = isStab ? "ORBIT_STAB" : "ORBIT";
    (proj as any).behavior = behavior;

    (proj as any).orbitAngle = angle;
    (proj as any).orbitRadiusBase = stats.orbitRadiusBase !== undefined ? stats.orbitRadiusBase : 36;
    (proj as any).orbitRadiusCurrent = (proj as any).orbitRadiusBase;
    (proj as any).orbitSpeed = stats.speed || 0.7;
    
    (proj as any).orbitSpeedBase = stats.speed || 0.7;
    (proj as any).orbitSpeedAggro = stats.orbitSpeedAggro || 3.0;

    (proj as any).stabRange = stats.range || 40; 
    (proj as any).slotIndex = i;
    (proj as any).slotTotal = stats.count;
    (proj as any).currentLevel = stats.currentLevel;

    
    const speedFactor = (stats.speed || 0.7) / 0.7;
    const aggroFactor = stats.aggroSpeedMultiplier || 1.6;
    const speedMult = speedFactor * aggroFactor * (player?.stats.fireRate || 1);
    (proj as any).speedMult = speedMult;
    (proj as any).stabSpeed = 200 * speedMult;

    (proj as any).triggerRange = stats.triggerRange; 

    (proj as any).state = "ORBIT"; 

    (proj as any).hitInterval = stats.hitInterval || 200; 

    
    if (ownerId && weaponId) {
      proj.parentID = ownerId;
      proj.weaponId = weaponId;
      proj.duration = 9999999; 
      (proj as any).owner = { id: ownerId, position: origin }; 
    } else {
      
      (proj as any).orbitCenter = origin;
      (proj as any).orbitRadiusBase = 25;
    }

    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    (proj as any).hitInterval = stats.hitInterval || 200; 
    proj.penetration = 999; 

    addProjectile(proj);
  }
};

const fireReturn = (origin: Vector2D, stats: any, type: any) => {
  
  const activeBoomerangs = getProjectiles().filter(
    p => (p as any).behavior === "RETURN" && !(p as any).hasFullyReturned,
  );

  
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
    (proj as any).hasFullyReturned = false; 
    (proj as any).speed = stats.speed || 400;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 1; 
    (proj as any).hitInterval = 150; 
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    addProjectile(proj);
  }
};

const fireSpread = (_player: Player, origin: Vector2D, stats: any, type: any, weaponId?: string) => {
  const target = getNearestEnemy(origin);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2;

  const isShotgun = weaponId === "W17";
  const spreadAngle = isShotgun ? Math.PI / 5 : Math.PI / 4;
  const count = Math.max(1, Math.floor(stats.count || 1));
  const step = count > 1 ? spreadAngle / (count - 1) : 0;

  const buildShotgunOrder = (projectileCount: number) => {
    const order: number[] = [0];
    for (let i = 1; i < projectileCount; i++) {
      const ring = Math.ceil(i / 2);
      const sign = i % 2 === 1 ? -1 : 1;
      order.push(ring * sign);
    }
    return order;
  };

  const shotgunOrder = buildShotgunOrder(count);

  for (let i = 0; i < count; i++) {
    const centeredIndex = i - (count - 1) / 2;
    const angle = isShotgun
      ? baseAngle + shotgunOrder[i] * step
      : baseAngle + centeredIndex * (count > 0 ? spreadAngle / count : 0);

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "LINEAR";
    (proj as any).speed = stats.speed || (isShotgun ? 620 : 320);
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    if (weaponId) {
      (proj as any).weaponId = weaponId;
    }
    if (isShotgun) {
      (proj as any).range = Math.min(stats.range || 150, 150);
      (proj as any).pelletLength = Math.max(12, (stats.size || 8) * 2.0);
    }
    proj.penetration = stats.pierce || 1;
    (proj as any).chillAmount = stats.chillAmount;
    (proj as any).chillDuration = stats.chillDuration;
    (proj as any).freezeDuration = stats.freezeDuration;
    addProjectile(proj);
  }
};

const fireLinear = (_player: Player, origin: Vector2D, stats: any, type: any) => {
  const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]; 

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
  
  const target = getNearestEnemy(origin);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2; 

  const spread = 0.3; 
  for (let i = 0; i < stats.count; i++) {
    const angle = baseAngle + (i - (stats.count - 1) / 2) * spread;
    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "BEAM"; 
    (proj as any).ownerId = ownerId; 
    (proj as any).speed = 0; 
    proj.damage = stats.damage;
    (proj as any).radius = stats.size;
    proj.penetration = stats.pierce || 999; 
    (proj as any).range = stats.range || 1000; 
    (proj as any).duration = stats.duration || 2000; 
    (proj as any).hitInterval = 2000; 
    addProjectile(proj);
  }
};


const spawnArea = (_player: Player, origin: Vector2D, stats: any, type: any, behavior: AreaBehavior) => {
  
  if (type === ElementType.POISON && behavior === "STATIC") {
    const weaponRange = stats.range || 300;
    const target = getNearestEnemy(origin, weaponRange);

    
    if (!target) return;

    for (let i = 0; i < stats.count; i++) {
      let finalPos = { ...target.position };

      
      if (i > 0) {
        finalPos.x += (Math.random() - 0.5) * 150;
        finalPos.y += (Math.random() - 0.5) * 150;
      }

      const proj = createProjectile(origin.x, origin.y, 0, type, 1, "PROJECTILE" as any);
      (proj as any).behavior = "BOTTLE";
      (proj as any).targetPos = finalPos; 
      (proj as any).startPos = { ...origin };
      (proj as any).speed = stats.speed || 200; 
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

  
  let spawnPos = { ...origin };
  if (behavior === "STATIC" || behavior === "VORTEX") {
    const weaponRange = stats.range || 300;
    const target = getNearestEnemy(origin, weaponRange);
    if (target) {
      spawnPos = { ...target.position };
    } else {
      
      spawnPos.x += (Math.random() - 0.5) * 200;
      spawnPos.y += (Math.random() - 0.5) * 200;
    }
  }

  for (let i = 0; i < stats.count; i++) {
    const offset = i === 0 ? { x: 0, y: 0 } : { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 };

    
    if (behavior === "STATIC" && stats.count === 1) {
      
    } else {
      spawnPos.x += offset.x;
      spawnPos.y += offset.y;
    }

    const area = createArea(spawnPos.x, spawnPos.y, type, behavior, {
      damage: stats.damage,
      radius: stats.size,
      duration: stats.duration || 3000,
      tickRate: 200, 
      chillAmount: stats.chillAmount,
      chillDuration: stats.chillDuration,
      freezeDuration: stats.freezeDuration,
    });

    
    if (behavior === "VORTEX") {
      area.vortexStrength = 200 + stats.damage * 5; 
    }
    if (behavior === "DRIFT") {
      area.driftSpeed = stats.speed || 50;
    }

    addArea(area);
  }
};


const createAuraWeapon = (player: Player, stats: any, type: any) => {
  const area = createArea(player.position.x, player.position.y, type, "FOLLOW", {
    damage: stats.damage,
    radius: stats.size,
    duration: stats.duration || 999999,
    tickRate: stats.cooldown || 500, 
  });
  area.followTarget = player;
  addArea(area);
};




const fireChakram = (_player: Player, origin: Vector2D, stats: any, type: any) => {
  for (let i = 0; i < stats.count; i++) {
    const target = getNearestEnemy(origin, 600);
    const angle = target
      ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
      : Math.random() * Math.PI * 2;

    
    const spread = stats.count > 1 ? Math.PI / 4 : 0;
    const startAngle = stats.count > 1 ? angle - spread / 2 : angle;
    const step = stats.count > 1 ? spread / (stats.count - 1) : 0;
    const finalAngle = startAngle + step * i;

    const proj = createProjectile(origin.x, origin.y, finalAngle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "CHAKRAM";
    (proj as any).speed = stats.speed || 280;
    proj.damage = stats.damage;
    (proj as any).radius = stats.size || 16;
    proj.penetration = stats.pierce || 5; 
    (proj as any).bounceRange = 300; 
    (proj as any).hitEnemyIds = []; 

    addProjectile(proj);
  }
};




const fireFlame = (player: Player, origin: Vector2D, stats: any, type: any, ownerId?: string) => {
  
  let sourceEntity: any = player;
  let firePos = { ...origin };

  if (ownerId) {
    const tail = getTail().find(t => t.id === ownerId);
    if (tail) {
      sourceEntity = tail;
      firePos = { x: tail.position.x, y: tail.position.y };
    }
  }

  
  const target = getNearestEnemy(firePos, 400);

  
  if (!target) return;

  const aimAngle = Math.atan2(target.position.y - firePos.y, target.position.x - firePos.x);

  
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

  
  area.coneAngle = aimAngle;

  
  area.followTarget = sourceEntity;

  addArea(area);
};




const fireGravityOrb = (_player: Player, origin: Vector2D, stats: any, type: any) => {
  const target = getNearestEnemy(origin, 500);
  const baseAngle = target
    ? Math.atan2(target.position.y - origin.y, target.position.x - origin.x)
    : Math.random() * Math.PI * 2;

  
  const arc = Math.PI / 6; 
  const startAngle = stats.count > 1 ? baseAngle - arc / 2 : baseAngle;
  const stepAngle = stats.count > 1 ? arc / (stats.count - 1) : 0;

  for (let i = 0; i < stats.count; i++) {
    const angle = startAngle + stepAngle * i;

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    (proj as any).behavior = "GRAVITY_ORB";
    (proj as any).speed = stats.speed || 120;
    proj.damage = stats.damage;
    (proj as any).radius = 12; 
    proj.penetration = 1; 
    (proj as any).maxRange = 400; 
    (proj as any).distanceTraveled = 0;

    
    (proj as any).areaStats = {
      damage: stats.damage,
      radius: stats.size,
      duration: stats.duration || 3000,
      tickRate: 500,
    };
    (proj as any).vortexStrength = 150 + stats.damage * 3; 

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

