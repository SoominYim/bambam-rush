import { getEnemies, getTail, getProjectiles, addProjectile, getPlayer } from "@/game/managers/state";
import { createProjectile } from "@/game/entities/projectile";
import { VFXFactory } from "@/engine/vfx/VFXFactory";
import { SPELL_STATS } from "@/game/config/spellStats";
import { SkillBehavior, ElementType } from "@/game/types";
import * as CONFIG from "@/game/config/constants";
import { spatialGrid } from "@/game/managers/grid";
import { damageTextManager } from "@/game/managers/damageTextManager";

// Cooldown tracker
const fireTimers: Record<string, number> = {};
// Active orbital and recurring skill tracking
const activeSkillIds = new Set<string>();

export const updateCombat = (_deltaTime: number) => {
  const player = getPlayer();
  if (!player) return;

  const enemies = getEnemies();
  const tail = getTail();
  const now = Date.now();

  // 1. Tail Turrets Logic
  tail.forEach(segment => {
    if (!fireTimers[segment.id]) {
      fireTimers[segment.id] = 0;
    }

    const stats = SPELL_STATS[segment.type];
    if (!stats) return;

    // Calculate attack speed: Base / (Player FireRate * Skill Mult)
    const fireRateMult = stats.fireRateMult || 1.0;
    const actualFireRate = getFireRate(segment.tier, player.stats.fireRate * fireRateMult);

    const timeSinceLastFire = now - fireTimers[segment.id];
    if (timeSinceLastFire < actualFireRate) {
      return;
    }

    // Different behavior handling
    switch (stats.behavior) {
      case SkillBehavior.PROJECTILE:
        handleProjectileFiring(segment, enemies, now);
        break;
      case SkillBehavior.MELEE:
        handleMeleeAttack(segment, enemies, now, player.stats.atk);
        break;
      case SkillBehavior.ORBITAL:
        handleOrbitalSkill(segment, now);
        break;
      case SkillBehavior.AREA:
        handleAreaSkill(segment, enemies, now);
        break;
    }
  });

  // 2. Projectile / Skill Collision & Lifecycle
  const allProjectiles = getProjectiles();
  allProjectiles.forEach(p => {
    if (p.isExpired) return;

    const stats = SPELL_STATS[p.type];

    // Optimized lookup: Only check enemies near the projectile
    const hitRadius = stats.behavior === SkillBehavior.AREA ? stats.size : CONFIG.PROJECTILE_HIT_RADIUS;
    const nearbyEnemies = spatialGrid.getNearbyEnemies(p.position.x, p.position.y, hitRadius);

    nearbyEnemies.forEach(e => {
      if (p.isExpired || e.isExpired || e.hp <= 0) return;

      const dx = p.position.x - e.position.x;
      const dy = p.position.y - e.position.y;
      // Use distSq to avoid Math.sqrt
      const distSq = dx * dx + dy * dy;

      if (distSq < hitRadius * hitRadius) {
        // Hit! Applying player ATK multiplier
        const finalDamage = p.damage * player.stats.atk * (stats.behavior === SkillBehavior.AREA ? 0.1 : 1.0);
        e.hp -= finalDamage;

        damageTextManager.show(e.position.x, e.position.y, finalDamage, finalDamage > p.damage * 1.5);

        VFXFactory.createImpact(p.position.x, p.position.y, p.type);

        if (e.hp <= 0) {
          e.isExpired = true;
          VFXFactory.createExplosion(e.position.x, e.position.y, p.type, 15);
        }

        // Projectiles expire on hit, Areas and Orbitals don't
        if (stats.behavior === SkillBehavior.PROJECTILE) {
          p.penetration--;
          if (p.penetration <= 0) {
            p.isExpired = true;
          }
        }
      }
    });
  });

  // Cleanup expired skill IDs
  getProjectiles().forEach(p => {
    if (p.isExpired && p.parentID) {
      activeSkillIds.delete(`${p.parentID}_${p.type}`);
    }
  });

  // 3. Cleanup old fire timers
  const activeTailIds = new Set(tail.map(s => s.id));
  Object.keys(fireTimers).forEach(id => {
    if (!activeTailIds.has(id)) {
      delete fireTimers[id];
    }
  });
};

const handleProjectileFiring = (segment: any, _enemies: any[], now: number) => {
  // Optimized lookup
  const nearby = spatialGrid.getNearbyEnemies(segment.position.x, segment.position.y, CONFIG.TURRET_RANGE);
  let nearest: any = null;
  let minDistSq = CONFIG.TURRET_RANGE * CONFIG.TURRET_RANGE;

  nearby.forEach(e => {
    if (e.isExpired || e.hp <= 0) return;
    const dx = e.position.x - segment.position.x;
    const dy = e.position.y - segment.position.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDistSq) {
      minDistSq = dSq;
      nearest = e;
    }
  });

  if (nearest) {
    const angle = Math.atan2(nearest.position.y - segment.position.y, nearest.position.x - segment.position.x);
    const proj = createProjectile(
      segment.position.x,
      segment.position.y,
      angle,
      segment.type,
      segment.tier,
      SkillBehavior.PROJECTILE,
    );
    addProjectile(proj);
    fireTimers[segment.id] = now;
  }
};

const handleOrbitalSkill = (segment: any, now: number) => {
  const skillKey = `${segment.id}_${segment.type}`;
  if (activeSkillIds.has(skillKey)) return;

  const orbital = createProjectile(
    segment.position.x,
    segment.position.y,
    Math.random() * Math.PI * 2,
    segment.type,
    segment.tier,
    SkillBehavior.ORBITAL,
    segment.id,
  );
  addProjectile(orbital);
  activeSkillIds.add(skillKey);
  fireTimers[segment.id] = now;
};

const handleAreaSkill = (segment: any, _enemies: any[], now: number) => {
  // Optimized lookup
  const nearby = spatialGrid.getNearbyEnemies(segment.position.x, segment.position.y, CONFIG.TURRET_RANGE);
  let targetE: any = null;
  let minDistSq = CONFIG.TURRET_RANGE * CONFIG.TURRET_RANGE;

  nearby.forEach(e => {
    if (e.isExpired || e.hp <= 0) return;
    const dx = e.position.x - segment.position.x;
    const dy = e.position.y - segment.position.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDistSq) {
      minDistSq = dSq;
      targetE = e;
    }
  });

  if (targetE) {
    const area = createProjectile(
      targetE.position.x,
      targetE.position.y,
      0,
      segment.type,
      segment.tier,
      SkillBehavior.AREA,
    );
    addProjectile(area);
    fireTimers[segment.id] = now;
  }
};

const handleMeleeAttack = (segment: any, _enemies: any[], now: number, playerAtk: number) => {
  const stats = SPELL_STATS[segment.type as ElementType];
  let hitAny = false;

  const nearby = spatialGrid.getNearbyEnemies(segment.position.x, segment.position.y, CONFIG.MELEE_RANGE);
  const rangeSq = CONFIG.MELEE_RANGE * CONFIG.MELEE_RANGE;

  nearby.forEach(e => {
    if (e.isExpired || e.hp <= 0) return;

    const dx = e.position.x - segment.position.x;
    const dy = e.position.y - segment.position.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < rangeSq) {
      const damage = stats.damage * segment.tier * playerAtk;
      e.hp -= damage;
      damageTextManager.show(e.position.x, e.position.y, damage, false);
      VFXFactory.createImpact(e.position.x, e.position.y, segment.type);

      if (e.hp <= 0) {
        e.isExpired = true;
        VFXFactory.createExplosion(e.position.x, e.position.y, segment.type, 15);
      }
      hitAny = true;
    }
  });

  if (hitAny) {
    fireTimers[segment.id] = now;
  }
};

const getFireRate = (tier: number, fireRateStat: number) => {
  const baseRate = Math.max(100, CONFIG.TURRET_BASE_FIRE_RATE - (tier - 1) * CONFIG.TURRET_FIRE_RATE_PER_TIER);
  return baseRate / fireRateStat;
};
