import { GameObject, ElementType, Player, Enemy } from "@/game/types";
import { getPlayer } from "@/game/managers/state";
import { spatialGrid } from "@/game/managers/grid";
import { damageTextManager } from "@/game/managers/damageTextManager";

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
    startTime: Date.now(),
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
      const now = Date.now();

      // ==========================================
      // [1] 색상 및 기본 스타일 설정
      // ==========================================
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
      }

      // ==========================================
      // [2] 독 웅덩이 특수 연출 (POISON)
      // ==========================================
      if (this.type === ElementType.POISON) {
        // --- 웅덩이 베이스 (강렬한 원형 + 리플 애니메이션) ---
        const startTime = (this as any).startTime || now;
        const elapsed = now - startTime;
        const birthProgress = Math.min(1, elapsed / 500);

        // 생성 시 확 퍼지는 효과와 미세한 진동
        const ripple = Math.sin(now / 300) * 4;
        const currentR = (this.radius + ripple) * (0.3 + birthProgress * 0.7);

        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, currentR, 0, Math.PI * 2);

        // 깊이감이 느껴지는 방사형 그라데이션 (중앙은 깊은 독, 외곽은 밝은 보라)
        const f = ctx.createRadialGradient(
          this.position.x,
          this.position.y,
          0,
          this.position.x,
          this.position.y,
          currentR,
        );
        f.addColorStop(0, "rgba(42, 0, 64, 0.9)"); // 중심 어두운 보라
        f.addColorStop(0.6, "rgba(74, 0, 128, 0.8)"); // 중간 보라
        f.addColorStop(1, "rgba(106, 0, 176, 0.3)"); // 테두리 부드럽게

        ctx.fillStyle = f;
        ctx.globalAlpha = 1.0;

        // 강한 광원 효과 (Glow)
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#aa00ff";

        ctx.fill();

        // --- 끓어오르는 기포 효과 (더 선명하고 화려하게) ---
        const bubbleCount = 8;
        for (let i = 0; i < bubbleCount; i++) {
          const seed = i * 157.5;
          const bubbleDuration = 1500;
          const bubbleTime = (now + seed) % bubbleDuration;
          const bubbleProgress = bubbleTime / bubbleDuration;

          const angle = (i / bubbleCount) * Math.PI * 2 + now / 2000;
          const dist = currentR * 0.7 * Math.abs(Math.cos(seed + now / 1200));
          const bx = this.position.x + Math.cos(angle) * dist;
          const by = this.position.y + Math.sin(angle) * dist;

          const maxBR = 8 + Math.sin(now / 200 + i) * 3;
          const bRadius = maxBR * (1 - Math.pow(bubbleProgress - 0.5, 2) * 4); // 커졌다가 작아지는 느낌

          if (bRadius > 0) {
            ctx.beginPath();
            ctx.arc(bx, by, bRadius, 0, Math.PI * 2);

            // 형광보라 기포 + 중앙 하이라이트
            const bg = ctx.createRadialGradient(bx, by, 0, bx, by, bRadius);
            bg.addColorStop(0, "#ffffff");
            bg.addColorStop(0.3, "#ff00ff");
            bg.addColorStop(1, "#aa00ff");

            ctx.fillStyle = bg;
            ctx.globalAlpha = 0.9;
            ctx.fill();

            // 기포 테두리
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
          }
        }

        // --- 테두리 마감 (선명한 네온 링) ---
        ctx.shadowBlur = 0; // 테두리엔 그림자 제거
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, currentR, 0, Math.PI * 2);
        ctx.strokeStyle = "#aa00ff";
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        // ==========================================
        // [3] 일반 장판 연출 (FIRE, ICE 등)
        // ==========================================
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

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

        // 적의 히트박스(대략 20)를 고려하여 판정
        if (dist <= this.radius + 20) {
          // 1. 데미지 적용 (방어력 계산)
          const def = (enemy as any).defense || 0;
          const finalDamage = Math.max(1, this.damage - def);

          enemy.hp -= finalDamage;

          // 2. 데미지 텍스트 표시
          damageTextManager.show(enemy.position.x, enemy.position.y, finalDamage, false);

          // 3. 중독 상태 효과 적용 (보라색 틴트용)
          // 기존 중독 효과 확인
          const existingPoison = enemy.statusEffects.find(e => e.type === ("POISON" as any));
          const poisonDamage = Math.max(1, Math.floor(this.damage * 0.3)); // 장판 데미지의 30%를 지속 피해로

          if (existingPoison) {
            existingPoison.duration = 2000; // 2초 유지
            existingPoison.damage = poisonDamage;
            existingPoison.lastTick = Date.now();
          } else {
            enemy.statusEffects.push({
              type: "POISON" as any,
              damage: poisonDamage,
              duration: 2000,
              lastTick: Date.now(),
              tickInterval: 500,
            });
          }
        }
      });
    },
  } as Area & { applyEffect: () => void }; // 타입 단언으로 메서드 추가 인식 시김
};
