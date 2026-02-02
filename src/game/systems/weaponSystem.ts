import { Player, ActiveWeapon, Scalar, Vector2D, Enemy, PassiveInstance } from "@/game/types";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import { PASSIVE_REGISTRY } from "@/game/config/passiveRegistry";
import { addProjectile, getEnemies, getTail } from "@/game/managers/state";
import { createProjectile } from "@/game/entities/projectile";
import { spatialGrid } from "@/game/managers/grid";

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
      if (scale.speed) stats.speed += scale.speed;
      if (scale.pierce) stats.pierce = (stats.pierce || 0) + scale.pierce;
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
        stats.speed *= 1 + pVal;
        break;
      case "P06": // Duration
        if (stats.duration) stats.duration *= 1 + pVal;
        break;
      case "P13": // Duplicator
        stats.count += pVal;
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

  switch (def.pattern) {
    case "projectile":
      fireProjectile(origin, stats, def.tags[0]);
      break;
    case "line":
      fireLine(origin, stats, def.tags[0]);
      break;
    case "chain":
      fireChain(origin, stats, def.tags[0]);
      break;
    case "area":
      spawnArea(origin, stats, def.tags[0]);
      break;
  }
};

const fireProjectile = (origin: Vector2D, stats: any, type: any) => {
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

  for (let i = 0; i < stats.count; i++) {
    const target = targets[i % targets.length];
    const angle = Math.atan2(target.position.y - origin.y, target.position.x - origin.x);

    const proj = createProjectile(origin.x, origin.y, angle, type, 1, "PROJECTILE" as any);
    proj.damage = stats.damage;
    (proj as any).speed = stats.speed;
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
    (proj as any).speed = stats.speed;
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
  (proj as any).speed = stats.speed;
  (proj as any).radius = stats.size;
  proj.penetration = stats.pierce || 3;
  addProjectile(proj);
};

const spawnArea = (origin: Vector2D, stats: any, type: any) => {
  const target = getNearestEnemy(origin);
  const spawnPos = target ? { ...target.position } : { ...origin };

  for (let i = 0; i < stats.count; i++) {
    const offset = i === 0 ? { x: 0, y: 0 } : { x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 };
    const area = createProjectile(spawnPos.x + offset.x, spawnPos.y + offset.y, 0, type, 1, "AREA" as any);
    area.damage = stats.damage;
    area.duration = stats.duration;
    (area as any).radius = stats.size;
    addProjectile(area);
  }
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
