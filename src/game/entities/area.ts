import { GameObject, ElementType, Player, Enemy } from "@/game/types";
import { getPlayer } from "@/game/managers/state";
import { spatialGrid } from "@/game/managers/grid";

export type AreaBehavior = "STATIC" | "FOLLOW" | "VORTEX" | "DRIFT" | "TRAP";

export interface Area extends GameObject {
  type: ElementType;
  behavior: AreaBehavior;
  radius: number;
  damage: number;
  duration: number;
  tickRate: number; // ms
  lastTick: number;

  // 가변 속성
  followTarget?: Player; // FOLLOW용
  vortexStrength?: number; // VORTEX용
  driftSpeed?: number; // DRIFT용
  driftAngle?: number; // DRIFT용
  isTrapArmed?: boolean; // TRAP용
}

export const createArea = (
  x: number,
  y: number,
  type: ElementType,
  behavior: AreaBehavior,
  stats: {
    damage: number;
    radius: number;
    duration: number;
    tickRate?: number;
  },
): Area => {
  return {
    id: `area_${Date.now()}_${Math.random()}`,
    position: { x, y },
    type,
    behavior,
    radius: stats.radius,
    damage: stats.damage,
    duration: stats.duration,
    tickRate: stats.tickRate || 200, // 기본 0.2초마다 틱
    lastTick: 0,
    isExpired: false,

    update(dt: number) {
      if (this.isExpired) return;

      this.duration -= dt * 1000;
      if (this.duration <= 0) {
        this.isExpired = true;
        return;
      }

      // 행동 패턴별 업데이트
      if (this.behavior === "FOLLOW") {
        if (!this.followTarget) {
          const player = getPlayer();
          if (player) this.followTarget = player;
        }

        if (this.followTarget) {
          this.position.x = this.followTarget.position.x;
          this.position.y = this.followTarget.position.y;
        }
      } else if (this.behavior === "DRIFT") {
        if (this.driftSpeed === undefined) {
          this.driftSpeed = 50;
          this.driftAngle = Math.random() * Math.PI * 2;
        }
        this.position.x += Math.cos(this.driftAngle!) * this.driftSpeed * dt;
        this.position.y += Math.sin(this.driftAngle!) * this.driftSpeed * dt;
      }

      // 틱 데미지 처리
      const now = Date.now();
      if (now - this.lastTick >= this.tickRate) {
        this.lastTick = now;
        this.applyEffect();
      }
    },

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();

      // 색상 결정
      let color = "#ffffff";
      switch (this.type) {
        case ElementType.FIRE:
          color = "#ff4400";
          break;
        case ElementType.ICE:
          color = "#00ffff";
          break;
        case ElementType.POISON:
          color = "#aa00ff";
          break;
        case ElementType.GRAVITY:
          color = "#220022";
          break;
        // ... 기타 타입
      }

      // 그리기
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);

      // 내부 채우기 (투명도 조절)
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.fill();

      // 테두리
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    },

    // 효과 적용 메서드 (메서드 분리)
    applyEffect: function () {
      const nearby = spatialGrid.getNearbyEnemies(this.position.x, this.position.y, this.radius + 100) as Enemy[];

      if (this.behavior === "VORTEX") {
        // 적 당기기
        nearby.forEach(enemy => {
          if (enemy.isExpired) return;
          const dx = this.position.x - enemy.position.x;
          const dy = this.position.y - enemy.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.radius * 2 && dist > 10) {
            const pullStrength = (this.vortexStrength || 200) / dist;
            enemy.position.x += (dx / dist) * pullStrength;
            enemy.position.y += (dy / dist) * pullStrength;
          }
        });
      }

      // 데미지 입히기
      nearby.forEach(enemy => {
        if (enemy.isExpired) return;
        const dx = this.position.x - enemy.position.x;
        const dy = this.position.y - enemy.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.radius + (enemy as any).radius) {
          // enemy radius 가정
          // 데미지 처리 (간단하게 직접 체력 감소 시킴, 실제로는 damage system 연동 필요할 수 있음)
          enemy.hp -= this.damage;
          // 피격 효과 등은 여기서 처리하지 않음 (복잡도 감소)
        }
      });
    },
  } as Area & { applyEffect: () => void }; // 타입 단언으로 메서드 추가 인식 시김
};
