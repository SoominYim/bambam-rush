import {
  getEnemies,
  getTail,
  getProjectiles,
  addProjectile,
  getPlayer,
  addScore,
  addXPGem,
} from "@/game/managers/state";
import { createProjectile } from "@/game/entities/projectile";
import { VFXFactory } from "@/engine/vfx/VFXFactory";
import { SPELL_STATS } from "@/game/config/spellStats";
import { SkillBehavior, ElementType, Enemy } from "@/game/types";
import * as CONFIG from "@/game/config/constants";
import { spatialGrid } from "@/game/managers/grid";
import { damageTextManager } from "@/game/managers/damageTextManager";
import { StatusEffectType } from "@/game/types";
import { PASSIVE_REGISTRY } from "@/game/config/passiveRegistry";

// Cooldown tracker
const fireTimers: Record<string, number> = {};
// Active orbital and recurring skill tracking
const activeSkillIds = new Set<string>();

const getDamageBonus = (player: any): number => {
  let atkStat = player.stats.atk || 1.0;
  // 무력(Might) 패시브 체크 - 공격력 스탯에 합산
  const mightPassive = player.passives?.find((p: any) => p.id === "P01");
  if (mightPassive) {
    const pDef = PASSIVE_REGISTRY["P01"];
    const pVal = pDef.levels[mightPassive.level]?.value || 0;
    atkStat += pVal;
  }
  // 1.0을 기준으로 0.1당 +1 데미지 (합연산)
  return (atkStat - 1.0) * 10;
};

const grantKillRewards = (enemy: Enemy) => {
  if (enemy.isExpired) return;
  enemy.isExpired = true;
  addScore(enemy.type === "BOSS" ? 1000 : 50);
  const xpMin = enemy.type === "BOSS" ? 500 : enemy.type === "TANK" ? 10 : enemy.type === "FAST" ? 2 : 1;
  const xpMax = enemy.type === "BOSS" ? 1000 : enemy.type === "TANK" ? 20 : enemy.type === "FAST" ? 5 : 3;
  const xpAmount = Math.floor(xpMin + Math.random() * (xpMax - xpMin + 1));
  addXPGem(enemy.position.x, enemy.position.y, xpAmount);
};

const applyPhaseMarkLinks = (projectile: any, hitEnemy: Enemy, directDamage: number, now: number) => {
  const markDuration = Math.max(700, projectile.duration || 1300);
  const linkRange = Math.max(100, projectile.chainRange || 170);
  const maxLinks = Math.max(1, Math.floor(projectile.chainCount || 1));
  const detonateCooldown = Math.max(250, projectile.hitInterval || 450);
  const sourceDetonationRatio = 1.4;
  const linkBaseRatio = 1.9;
  const linkDecay = 0.95;
  const bossMultiplier = 0.8;

  const markUntil = (hitEnemy as any).__phaseMarkUntil || 0;
  const recentlyDetonatedAt = (hitEnemy as any).__phaseDetonatedAt || 0;
  const isMarked = markUntil > now;

  // First hit: mark only (no link burst) so trigger timing is predictable.
  if (!isMarked) {
    (hitEnemy as any).__phaseMarkUntil = now + markDuration;
    return;
  }

  // Prevent rapid re-detonation on the same target.
  if (now - recentlyDetonatedAt < detonateCooldown) {
    return;
  }

  // Second hit on marked target: detonate and link.
  const nearbyTargets = spatialGrid
    .getNearbyEnemies(hitEnemy.position.x, hitEnemy.position.y, linkRange)
    .filter((e: Enemy) => !e.isExpired && e.hp > 0 && e.id !== hitEnemy.id)
    .sort((a: Enemy, b: Enemy) => {
      const da = (a.position.x - hitEnemy.position.x) ** 2 + (a.position.y - hitEnemy.position.y) ** 2;
      const db = (b.position.x - hitEnemy.position.x) ** 2 + (b.position.y - hitEnemy.position.y) ** 2;
      return da - db;
    });

  // Strict rule: only currently marked enemies can be linked/detonated.
  const linkTargets = nearbyTargets
    .filter((e: Enemy) => ((e as any).__phaseMarkUntil || 0) > now)
    .slice(0, maxLinks);

  // No extra marked target -> do not trigger.
  if (linkTargets.length === 0) {
    (hitEnemy as any).__phaseMarkUntil = now + markDuration;
    return;
  }

  // Primary detonation pulse on the re-hit target.
  VFXFactory.createPhaseLinkBurst(hitEnemy.position.x, hitEnemy.position.y, hitEnemy.position.x, hitEnemy.position.y);
  (hitEnemy as any).__phaseDetonatedAt = now;
  (hitEnemy as any).__phaseMarkUntil = 0; // consume trigger source mark

  // Trigger source also takes an extra detonation hit.
  {
    const sourceDef = (hitEnemy as any).defense || 0;
    let sourceBonus = Math.max(1, directDamage * sourceDetonationRatio);
    if (hitEnemy.type === "BOSS") sourceBonus *= bossMultiplier;
    const finalSourceBonus = Math.max(1, sourceBonus - sourceDef);
    hitEnemy.hp -= finalSourceBonus;
    damageTextManager.show(hitEnemy.position.x, hitEnemy.position.y, Math.floor(finalSourceBonus), true);
    if (hitEnemy.hp <= 0) {
      grantKillRewards(hitEnemy);
      return;
    }
  }

  let applied = 0;
  for (const target of linkTargets) {
    const def = (target as any).defense || 0;
    const ratio = linkBaseRatio * Math.pow(linkDecay, applied);
    let linkDamage = Math.max(1, directDamage * ratio);
    if (target.type === "BOSS") {
      linkDamage *= bossMultiplier;
    }
    const finalLinkDamage = Math.max(1, linkDamage - def);

    target.hp -= finalLinkDamage;
    (target as any).__phaseDetonatedAt = now;
    (target as any).__phaseMarkUntil = 0; // consume linked mark
    damageTextManager.show(target.position.x, target.position.y, Math.floor(finalLinkDamage), true);
    VFXFactory.createPhaseLinkBurst(hitEnemy.position.x, hitEnemy.position.y, target.position.x, target.position.y);

    if (target.hp <= 0) {
      grantKillRewards(target);
    }
    applied++;
  }
};

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
    if (!stats || segment.weaponId) return; // 새로운 무기 시스템이 적용된 세그먼트는 여기서 제외

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
        handleProjectileFiring(segment, enemies, now, player);
        break;
      case SkillBehavior.MELEE:
        // Skip passive melee aura for roguelike weapons (handled by stabbing projectiles)
        if (segment.weaponId) break;
        handleMeleeAttack(segment, enemies, now, player);
        break;
      case SkillBehavior.ORBITAL:
        handleOrbitalSkill(segment, now, player);
        break;
      case SkillBehavior.AREA:
        handleAreaSkill(segment, enemies, now, player);
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

      if ((p as any).behavior === "ORBIT_STAB" && (p as any).state === "ORBIT") {
        return;
      }

      // 자체 충돌 처리하는 행동들 제외
      if (
        (p as any).behavior === "BOTTLE" ||
        (p as any).behavior === "GRAVITY_ORB" ||
        (p as any).behavior === "CHAKRAM" ||
        (p as any).behavior === "BEAM" ||
        (p as any).behavior === "BAT" ||
        (p as any).behavior === "BLOSSOM"
      ) {
        return;
      }

      const distSq = dx * dx + dy * dy;

      if (distSq < hitRadius * hitRadius) {
        // Hit Interval Check
        const now = Date.now();
        if (p.hitInterval) {
          if (!p.hitTracker) p.hitTracker = {};
          const lastHit = p.hitTracker[e.id] || 0;
          if (now - lastHit < p.hitInterval) {
            return;
          }
          p.hitTracker[e.id] = now;
        }

        // Hit!
        // 방어력 적용 (최소 1 데미지)
        const def = (e as any).defense || 0;
        // p.damage now includes the unified damage multiplier from creation phase
        let finalDamage = Math.max(1, p.damage * (stats.behavior === SkillBehavior.AREA ? 0.1 : 1.0) - def);

        e.hp -= finalDamage;
        damageTextManager.show(e.position.x, e.position.y, finalDamage, finalDamage > p.damage * 1.5);

        // Life Steal Logic
        if ((p as any).lifeSteal && (p as any).lifeSteal > 0) {
          player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + (p as any).lifeSteal);
        }

        if ((p as any).weaponId === "W19") {
          applyPhaseMarkLinks(p as any, e, finalDamage, now);
        }

        // --- Status Effect Application ---
        if (p.type === ElementType.FIRE) {
          const burnDamage = (p as any).burnDamage || p.damage * 0.2;
          const burnDuration = (p as any).burnDuration || 3000;
          const existingBurn = e.statusEffects.find(eff => eff.type === StatusEffectType.BURN);
          if (existingBurn) {
            existingBurn.duration = burnDuration;
            existingBurn.damage = Math.max(existingBurn.damage, burnDamage);
          } else {
            e.statusEffects.push({
              type: StatusEffectType.BURN,
              damage: burnDamage,
              duration: burnDuration,
              lastTick: Date.now(),
              tickInterval: 500,
            });
          }
        }

        if (p.type === ElementType.ICE) {
          const chillAmount = (p as any).chillAmount || 0.3;
          const chillDuration = (p as any).chillDuration || 3000;
          const freezeDuration = (p as any).freezeDuration || 0;

          // 빙결 적용
          if (freezeDuration > 0) {
            const existingFreeze = e.statusEffects.find(eff => eff.type === StatusEffectType.FREEZE);
            if (existingFreeze) {
              existingFreeze.duration = Math.max(existingFreeze.duration, freezeDuration);
            } else {
              e.statusEffects.push({
                type: StatusEffectType.FREEZE,
                damage: 0,
                duration: freezeDuration,
                lastTick: Date.now(),
                tickInterval: 999999,
              });
            }
          }

          // 둔화 적용
          const existingChill = e.statusEffects.find(eff => eff.type === StatusEffectType.CHILL);
          if (existingChill) {
            existingChill.duration = Math.max(existingChill.duration, chillDuration);
            if (chillAmount > (existingChill.value || 0)) existingChill.value = chillAmount;
          } else {
            e.statusEffects.push({
              type: StatusEffectType.CHILL,
              damage: 0,
              duration: chillDuration,
              lastTick: Date.now(),
              tickInterval: 999999,
              value: chillAmount,
            });
          }
        }

        // --- Explosion Logic ---
        if ((p as any).explosionRadius && (p as any).explosionRadius > 0) {
          const radius = (p as any).explosionRadius;
          const explosionDamageRaw = finalDamage * 0.7; // Explosion deals 70% damage

          // 폭발 반경에 비례하여 비주얼 스케일 조정
          const visualScale = Math.max(1.2, radius / 50);
          VFXFactory.createExplosion(p.position.x, p.position.y, p.type, 35, visualScale);

          const neighbors = spatialGrid.getNearbyEnemies(p.position.x, p.position.y, radius);
          neighbors.forEach((neighbor: Enemy) => {
            if (neighbor.isExpired || neighbor.id === e.id) return;

            const nDef = (neighbor as any).defense || 0;
            const finalExplosionDamage = Math.max(1, explosionDamageRaw - nDef);

            neighbor.hp -= finalExplosionDamage;
            damageTextManager.show(neighbor.position.x, neighbor.position.y, Math.floor(finalExplosionDamage), false);

            if (p.type === ElementType.FIRE) {
              const burnDamage = (p as any).burnDamage || p.damage * 0.2;
              const burnDuration = (p as any).burnDuration || 3000;
              const nBurn = neighbor.statusEffects.find(eff => eff.type === StatusEffectType.BURN);
              if (nBurn) {
                nBurn.duration = burnDuration;
              } else {
                neighbor.statusEffects.push({
                  type: StatusEffectType.BURN,
                  damage: burnDamage,
                  duration: burnDuration,
                  lastTick: Date.now(),
                  tickInterval: 500,
                });
              }
            }

            if (p.type === ElementType.ICE) {
              const chillAmount = (p as any).chillAmount || 0.3;
              const chillDuration = (p as any).chillDuration || 3000;
              const freezeDuration = (p as any).freezeDuration || 0;

              // Freeze Transfer
              if (freezeDuration > 0) {
                const nFreeze = neighbor.statusEffects.find(eff => eff.type === StatusEffectType.FREEZE);
                if (nFreeze) nFreeze.duration = Math.max(nFreeze.duration, freezeDuration);
                else
                  neighbor.statusEffects.push({
                    type: StatusEffectType.FREEZE,
                    damage: 0,
                    duration: freezeDuration,
                    lastTick: Date.now(),
                    tickInterval: 999999,
                  });
              }

              // Chill Transfer
              const nChill = neighbor.statusEffects.find(eff => eff.type === StatusEffectType.CHILL);
              if (nChill) {
                nChill.duration = Math.max(nChill.duration, chillDuration);
                if (chillAmount > (nChill.value || 0)) nChill.value = chillAmount;
              } else {
                neighbor.statusEffects.push({
                  type: StatusEffectType.CHILL,
                  damage: 0,
                  duration: chillDuration,
                  lastTick: Date.now(),
                  tickInterval: 999999,
                  value: chillAmount,
                });
              }
            }

            if (neighbor.hp <= 0) {
              neighbor.isExpired = true;
            }
          });
        } else {
          VFXFactory.createImpact(p.position.x, p.position.y, p.type);
        }

        if (e.hp <= 0) {
          grantKillRewards(e);
        }

        if (stats.behavior === SkillBehavior.PROJECTILE) {
          // --- Chain Lightning Logic ---
          if ((p as any).weaponId !== "W19" && (p as any).chainCount && (p as any).chainCount > 0) {
            const chainCount = (p as any).chainCount;
            const chainRange = (p as any).chainRange || 150;
            applyChainLightning(e, finalDamage, chainCount, chainRange, [e.id]);
          }

          p.penetration--;
          if (p.penetration <= 0) {
            p.isExpired = true;
          }
        }
      }
    });
  });

  // Cleanup & On-Death Events
  getProjectiles().forEach(p => {
    if (p.isExpired) {
      if (p.parentID) {
        activeSkillIds.delete(`${p.parentID}_${p.type}`);
      }
    }
  });

  const activeTailIds = new Set(tail.map(s => s.id));
  Object.keys(fireTimers).forEach(id => {
    if (!activeTailIds.has(id)) {
      delete fireTimers[id];
    }
  });
};

const handleProjectileFiring = (segment: any, _enemies: any[], now: number, player: any) => {
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
    const damageBonus = getDamageBonus(player);
    const angle = Math.atan2(nearest.position.y - segment.position.y, nearest.position.x - segment.position.x);
    const proj = createProjectile(
      segment.position.x,
      segment.position.y,
      angle,
      segment.type,
      segment.tier,
      SkillBehavior.PROJECTILE,
    );
    // Apply unified multiplier to turret damage
    proj.damage += damageBonus;

    addProjectile(proj);
    fireTimers[segment.id] = now;
  }
};

const handleOrbitalSkill = (segment: any, now: number, player: any) => {
  const skillKey = `${segment.id}_${segment.type}`;
  if (activeSkillIds.has(skillKey)) return;
  const damageBonus = getDamageBonus(player);
  const orbital = createProjectile(
    segment.position.x,
    segment.position.y,
    Math.random() * Math.PI * 2,
    segment.type,
    segment.tier,
    SkillBehavior.ORBITAL,
    segment.id,
  );
  orbital.damage += damageBonus;

  addProjectile(orbital);
  activeSkillIds.add(skillKey);
  fireTimers[segment.id] = now;
};

const handleAreaSkill = (segment: any, _enemies: any[], now: number, player: any) => {
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
    const damageBonus = getDamageBonus(player);
    const area = createProjectile(
      targetE.position.x,
      targetE.position.y,
      0,
      segment.type,
      segment.tier,
      SkillBehavior.AREA,
    );
    area.damage += damageBonus;

    addProjectile(area);
    fireTimers[segment.id] = now;
  }
};

const handleMeleeAttack = (segment: any, _enemies: any[], now: number, player: any) => {
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
      const damageBonus = getDamageBonus(player);
      const damage = stats.damage * segment.tier + damageBonus;
      e.hp -= damage;
      damageTextManager.show(e.position.x, e.position.y, damage, false);
      VFXFactory.createImpact(e.position.x, e.position.y, segment.type);
      if (e.hp <= 0) {
        e.isExpired = true;
      }
      hitAny = true;
    }
  });
  if (hitAny) fireTimers[segment.id] = now;
};

const getFireRate = (tier: number, fireRateStat: number) => {
  const baseRate = Math.max(100, CONFIG.TURRET_BASE_FIRE_RATE - (tier - 1) * CONFIG.TURRET_FIRE_RATE_PER_TIER);
  return baseRate / fireRateStat;
};

export const applyChainLightning = (
  currentEnemy: Enemy,
  baseDamage: number,
  remainingChains: number,
  range: number,
  hitIds: string[],
) => {
  if (remainingChains <= 0) return;

  const nearby = spatialGrid.getNearbyEnemies(currentEnemy.position.x, currentEnemy.position.y, range);
  const nextTarget = nearby.find(n => !n.isExpired && n.hp > 0 && !hitIds.includes(n.id));

  if (nextTarget) {
    const nextDamage = baseDamage * 0.85; // 전이될 때마다 데미지 15% 감소
    const actualDamage = nextDamage; // baseDamage already includes multiplier

    nextTarget.hp -= actualDamage;
    damageTextManager.show(nextTarget.position.x, nextTarget.position.y, Math.floor(actualDamage), false);
    VFXFactory.createLightningChain(
      currentEnemy.position.x,
      currentEnemy.position.y,
      nextTarget.position.x,
      nextTarget.position.y,
    );

    // 적 처치 체크 (폭발 제거)
    if (nextTarget.hp <= 0) {
      nextTarget.isExpired = true;
      addScore(50);
      addXPGem(nextTarget.position.x, nextTarget.position.y, 2);
    }

    // 다음 전이
    applyChainLightning(nextTarget, nextDamage, remainingChains - 1, range, [...hitIds, nextTarget.id]);
  }
};
