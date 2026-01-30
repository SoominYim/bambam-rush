import { getEnemies, getTail, getProjectiles, addProjectile } from "./gameState";
import { createProjectile } from "./entities/projectile";
import * as CONFIG from "./constants";

// Cooldown tracker
const fireTimers: Record<string, number> = {};

export const updateCombat = (deltaTime: number) => {
  const enemies = getEnemies();
  const tail = getTail();
  const projectiles = getProjectiles();
  const now = Date.now();

  // 1. Tail Turrets Logic
  tail.forEach(segment => {
    // Init timer if not exists
    if (!fireTimers[segment.id]) {
      fireTimers[segment.id] = 0;
    }

    // Check cooldown
    const fireRate = getFireRate(segment.tier);
    const timeSinceLastFire = now - fireTimers[segment.id];

    if (timeSinceLastFire < fireRate) {
      return; // Still on cooldown
    }

    // Find nearest enemy (that's alive!)
    let nearest: any = null;
    let minDist = CONFIG.TURRET_RANGE;

    enemies.forEach(e => {
      // Skip dead/expired enemies
      if (e.isExpired || e.hp <= 0) return;

      const dx = e.position.x - segment.position.x;
      const dy = e.position.y - segment.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    });

    // Fire if target found
    if (nearest && !nearest.isExpired) {
      const angle = Math.atan2(nearest.position.y - segment.position.y, nearest.position.x - segment.position.x);

      const proj = createProjectile(segment.position.x, segment.position.y, angle, segment.type, segment.tier);

      addProjectile(proj);
      fireTimers[segment.id] = now; // Update timer AFTER successful fire
    }
  });

  // 2. Projectile Collision
  projectiles.forEach(p => {
    if (p.isExpired) return;

    enemies.forEach(e => {
      if (p.isExpired || e.isExpired || e.hp <= 0) return;

      const dx = p.position.x - e.position.x;
      const dy = p.position.y - e.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) {
        // Hit!
        e.hp -= p.damage;

        if (e.hp <= 0) {
          e.isExpired = true;
        }

        // Penetration check
        p.penetration--;
        if (p.penetration <= 0) {
          p.isExpired = true;
        }
      }
    });
  });

  // 3. Cleanup old fire timers for expired segments
  const activeTailIds = new Set(tail.map(s => s.id));
  Object.keys(fireTimers).forEach(id => {
    if (!activeTailIds.has(id)) {
      delete fireTimers[id];
    }
  });
};

const getFireRate = (tier: number) => {
  return Math.max(100, CONFIG.TURRET_BASE_FIRE_RATE - tier * CONFIG.TURRET_FIRE_RATE_PER_TIER);
};
