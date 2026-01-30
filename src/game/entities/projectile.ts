import { Projectile, Scalar, ElementType } from "../types";

export const createProjectile = (
  x: Scalar,
  y: Scalar,
  angle: number,
  type: ElementType,
  tier: number = 1,
): Projectile => {
  const speed = 400 + tier * 50;
  const radius = 5 + tier * 2;
  const damage = 30 * tier;

  // Visuals based on type
  let color = "#fff";
  switch (type) {
    case ElementType.FIRE:
      color = "#ff4400";
      break;
    case ElementType.WATER:
      color = "#0088ff";
      break;
    case ElementType.ICE:
      color = "#00ffff";
      break; // Freezing effect?
    case ElementType.WIND:
      color = "#ccffcc";
      break; // Piercing?

    case ElementType.STEAM:
      color = "#ddd";
      break;
    case ElementType.LAVA:
      color = "#800";
      break;
    case ElementType.INFERNO:
      color = "#f0f";
      break;
    case ElementType.ICEBERG:
      color = "#008";
      break; // Heavy
    case ElementType.STORM:
      color = "#ff0";
      break;
    case ElementType.BLIZZARD:
      color = "#adf";
      break;
  }

  return {
    id: `proj_${Date.now()}_${Math.random()}`,
    position: { x, y },
    damage,
    penetration: tier >= 2 ? 2 : 1, // Tier 2+ pierces
    isExpired: false,

    update: function (deltaTime: Scalar) {
      this.position.x += Math.cos(angle) * speed * deltaTime;
      this.position.y += Math.sin(angle) * speed * deltaTime;

      // Expire if off screen (with some margin)
      if (
        this.position.x < -100 ||
        this.position.x > window.innerWidth + 100 ||
        this.position.y < -100 ||
        this.position.y > window.innerHeight + 100
      ) {
        this.isExpired = true;
      }
    },

    draw: function (ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Trail or Glow
      ctx.shadowBlur = tier * 5;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  };
};
