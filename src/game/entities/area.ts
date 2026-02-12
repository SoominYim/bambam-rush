import { GameObject, ElementType, Player, Enemy } from "@/game/types";
import { getPlayer } from "@/game/managers/state";
import { spatialGrid } from "@/game/managers/grid";
import { damageTextManager } from "@/game/managers/damageTextManager";
import { VFXFactory } from "@/engine/vfx/VFXFactory";

export type AreaBehavior = "STATIC" | "FOLLOW" | "VORTEX" | "DRIFT" | "TRAP" | "FLAME_CONE";

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
  coneAngle?: number; // FLAME_CONE용 방향
  coneSpread?: number; // FLAME_CONE용 확산각
  maxRadius?: number; // FLAME_CONE용 최대 반경 (애니메이션용)
  animT?: number; // 애니메이션 진행률 (0~1)

  // 상태 이상 속성
  startTime: number;
  chillAmount?: number;
  chillDuration?: number;
  freezeDuration?: number;

  applyEffect: () => void;
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
    chillAmount?: number;
    chillDuration?: number;
    freezeDuration?: number;
    coneSpread?: number; // Added
  },
): Area => {
  return {
    id: `area_${Date.now()}_${Math.random()}`,
    position: { x, y },
    type,
    behavior,
    radius: behavior === "FLAME_CONE" ? 0 : stats.radius,
    maxRadius: stats.radius, // 원래 크기 저장
    damage: stats.damage,
    duration: stats.duration,
    tickRate: stats.tickRate || 200, // 기본 0.2초마다 틱
    chillAmount: stats.chillAmount,
    chillDuration: stats.chillDuration,
    freezeDuration: stats.freezeDuration,
    coneSpread: stats.coneSpread,
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
      } else if (this.behavior === "FLAME_CONE") {
        // [FLAME_CONE] 타겟(플레이어 or 꼬리)을 따라다님
        // weaponSystem에서 생성 시 이미 area.followTarget을 설정했을 것임.
        // 만약 없다면 getPlayer()로 fallback

        let target = this.followTarget;
        if (!target) {
          target = getPlayer() || undefined;
        }

        if (target) {
          this.position.x = target.position.x;
          this.position.y = target.position.y;

          // 애니메이션: 작았다 커졌다 작아짐 (판정과 이펙트 동기화)
          // maxDuration 초기화 (첫 프레임에 설정)
          if ((this as any).maxDuration === undefined) {
            (this as any).maxDuration = this.duration;
          }

          const maxDur = (this as any).maxDuration || this.duration; // Fallback
          // duration은 dt만큼 줄어들고 있으므로, t는 0(시작) -> 1(끝)
          const t = 1 - this.duration / maxDur;

          const maxR = this.maxRadius || this.radius;

          // 애니메이션 커브: 팽창 -> 유지 -> 수축
          // 이 곡선에 따라 radius가 변하고, draw와 applyEffect 모두 이 radius를 사용함.
          if (t < 0.2) {
            // 0~20%: 0 -> 100% (팽창)
            this.radius = maxR * (t / 0.2);
          } else if (t < 0.7) {
            // 20~70%: 100% (유지)
            this.radius = maxR;
          } else {
            // 70~100%: 100% -> 0% (수축)
            this.radius = maxR * (1 - (t - 0.7) / 0.3);
          }

          // 최소 반지름 보정
          if (this.radius < 1) this.radius = 0;
        }
      } else if (this.behavior === "DRIFT") {
        if (this.driftSpeed === undefined) {
          this.driftSpeed = 50;
          this.driftAngle = Math.random() * Math.PI * 2;
        }
        this.position.x += Math.cos(this.driftAngle!) * this.driftSpeed * dt;
        this.position.y += Math.sin(this.driftAngle!) * this.driftSpeed * dt;
      } else if (this.behavior === "TRAP") {
        // TRAP 로직: 적이 밟으면 폭발
        const nearby = spatialGrid.getNearbyEnemies(this.position.x, this.position.y, this.radius + 100) as Enemy[];
        let triggered = false;

        // Trigger check: 지뢰 반경 전체를 감지 범위로 사용
        const triggerRadius = this.radius;

        for (const enemy of nearby) {
          if (enemy.isExpired) continue;
          const dx = this.position.x - enemy.position.x;
          const dy = this.position.y - enemy.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < triggerRadius + 20) {
            // +20 for enemy size
            triggered = true;
            break;
          }
        }

        if (triggered) {
          this.applyEffect(); // Explode
          this.isExpired = true; // Remove mine
          return;
        }
      } else if (this.behavior === "VORTEX") {
        // VORTEX: 매 프레임 끌어당기기 + 회전 + 흔들림
        const nearby = spatialGrid.getNearbyEnemies(this.position.x, this.position.y, this.radius * 2 + 100) as Enemy[];
        const baseStrength = this.vortexStrength || 200;

        nearby.forEach(enemy => {
          if (enemy.isExpired) return;
          const dx = this.position.x - enemy.position.x;
          const dy = this.position.y - enemy.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.radius * 2 && dist > 5) {
            const normalizedDist = dist / this.radius;
            // 거리에 따른 힘 조절 (중심일수록 강함)
            const strengthFactor = 1 / (normalizedDist * normalizedDist + 0.8); // 0.5 -> 0.8 더 완만하게
            const pullForce = baseStrength * 0.6 * strengthFactor * dt; // 기본 힘 60%로 하향

            // 1. 끌어당기기 (Centripetal)
            enemy.position.x += (dx / dist) * pullForce;
            enemy.position.y += (dy / dist) * pullForce;

            // 2. 회전 (Tangential) - 소용돌이 느낌 강화
            // 시계 방향 회전: (-dy, dx)
            const rotForce = pullForce * 0.8; // 회전력을 끌어당기는 힘의 80%로 상향
            enemy.position.x += (-dy / dist) * rotForce;
            enemy.position.y += (dx / dist) * rotForce;

            // 3. 흔들림 (Jitter) - 최소화
            const jitter = 0.5; // 2.0 -> 0.5 대폭 감소
            enemy.position.x += (Math.random() - 0.5) * jitter;
            enemy.position.y += (Math.random() - 0.5) * jitter;
          }
        });
      }

      // 틱 데미지 처리 (TRAP은 위에서 처리하므로 제외)
      if (this.behavior !== "TRAP") {
        const now = Date.now();
        if (now - this.lastTick >= this.tickRate) {
          this.lastTick = now;
          this.applyEffect();
        }
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
        case ElementType.PHYSICAL:
          color = "#aaaaaa"; // Grey for physical
          break;
      }

      // ==========================================
      // [TRAP] 지뢰 연출
      // ==========================================
      if (this.behavior === "TRAP") {
        // Blinking effect
        const blink = Math.sin(now / 100); // Fast blink
        const alpha = 0.5 + blink * 0.3;

        // Outer Ring
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 0.4, 0, Math.PI * 2); // Visual size smaller than blast area
        ctx.fillStyle = "#333333";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner Light
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`; // Red blink
        ctx.fill();

        // Spikes
        const spikes = 8;
        for (let i = 0; i < spikes; i++) {
          const angle = (i / spikes) * Math.PI * 2 + now / 2000;
          const rInner = this.radius * 0.4;
          const rOuter = this.radius * 0.55;
          ctx.beginPath();
          ctx.moveTo(this.position.x + Math.cos(angle) * rInner, this.position.y + Math.sin(angle) * rInner);
          ctx.lineTo(this.position.x + Math.cos(angle) * rOuter, this.position.y + Math.sin(angle) * rOuter);
          ctx.strokeStyle = "#555";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Trigger Range Indicator (faint)
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 0, 0, 0.2)";
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.setLineDash([]);
      } else if (this.behavior === "FLAME_CONE") {
        // [FLAME_CONE] 화염 방사 비주얼 (Streaming Fire)
        // 불꽃이 계속 뿜어져 나가는 운동감을 위해 오프셋 이동
        const count = 40; // 입자 수 적절히 조절 (50 -> 40)
        const spread = this.coneSpread || Math.PI / 6;
        const facing = this.coneAngle || 0;
        const now = Date.now();
        const flowSpeed = 2.0; // 흐름 속도
        const streamOffset = ((now / 1000) * flowSpeed) % 1; // 0 ~ 1

        ctx.save();

        // 블렌딩 모드: 불꽃이 겹칠수록 밝아지게 (Lighter) -> 3D 느낌 나서 싫어하면 끄라고 했지만,
        // 밀도 높은 2D 불꽃을 위해선 source-over에 알파값을 잘 쓰는게 좋음.
        // 여기선 source-over 유지하되 색상을 진하게.

        for (let i = 0; i < count; i++) {
          // 정규화 거리 (0~1)
          // i/count로 균등 분포하되, streamOffset을 더해 앞으로 전진하는 느낌
          let t = i / count + streamOffset;
          if (t > 1) t -= 1; // 순환

          // 거리: 현재 radius(애니메이션 적용됨)를 기준으로 배치
          const dist = t * this.radius;

          // 최소 거리 보정
          if (dist < 5) continue;

          // 각도: 거리가 멀수록 확산 (콘 형태)
          // 약간의 노이즈 추가
          const noise = (Math.random() - 0.5) * 0.5; // ±0.25 rad
          const currentSpread = spread * (0.2 + 0.8 * t); // 시작점은 좁고 끝은 넓음
          const angle = facing + (Math.random() - 0.5 + noise * 0.5) * currentSpread;

          const px = this.position.x + Math.cos(angle) * dist;
          const py = this.position.y + Math.sin(angle) * dist;

          // 입자 크기: 시작은 작고(5), 중간에 커지고(25), 끝에 작아짐(10)
          // Sin 곡선 활용: sin(0) -> 0, sin(PI/2) -> 1, sin(PI) -> 0
          // t(0~1) -> Math.sin(t * Math.PI)
          const sizeBase = 20;
          const size = 5 + sizeBase * Math.sin(t * Math.PI * 0.8); // 0.8까지 써서 끝이 완전히 0이 되진 않게

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);

          // 색상: 거리에 따라 변화
          // T < 0.3: Yellow (Hot)
          // T < 0.7: Orange
          // T > 0.7: Red / Dark Red

          if (t < 0.3) {
            ctx.fillStyle = `rgba(255, 255, 100, ${0.8})`;
          } else if (t < 0.6) {
            ctx.fillStyle = `rgba(255, 140, 0, ${0.7})`;
          } else {
            ctx.fillStyle = `rgba(200, 50, 50, ${0.6 * (1 - t)})`; // 끝부분 페이드 아웃
          }

          // 지터링: 매 프레임 위치 미세 조정으로 일렁임 표현
          const jitter = 2; // 2px
          ctx.arc(px + (Math.random() - 0.5) * jitter, py + (Math.random() - 0.5) * jitter, size, 0, Math.PI * 2);

          ctx.fill();
        }
        ctx.restore();
      } else if (this.type === ElementType.POISON) {
        // ... (Existing POISON logic)
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
      } else if (this.type === ElementType.GRAVITY) {
        // ==========================================
        // [GRAVITY / BLACK HOLE] 블랙홀 비주얼
        // ==========================================
        const elapsed = now - this.startTime;
        const birthProgress = Math.min(1, elapsed / 600);
        const currentR = this.radius * (0.2 + birthProgress * 0.8);

        // 1) 외부 왜곡 광환 (Accretion Disk)
        const rotAngle = now / 800; // 회전 속도
        const diskR = currentR * 1.3;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, diskR, 0, Math.PI * 2);
        const diskGrad = ctx.createRadialGradient(
          this.position.x,
          this.position.y,
          currentR * 0.6,
          this.position.x,
          this.position.y,
          diskR,
        );
        diskGrad.addColorStop(0, "rgba(138, 43, 226, 0)");
        diskGrad.addColorStop(0.5, "rgba(138, 43, 226, 0.15)");
        diskGrad.addColorStop(0.8, "rgba(75, 0, 130, 0.1)");
        diskGrad.addColorStop(1, "rgba(30, 0, 50, 0)");
        ctx.fillStyle = diskGrad;
        ctx.globalAlpha = 0.8;
        ctx.fill();

        // 2) 회전하는 나선 팔 (Spiral Arms)
        const spiralArms = 3;
        for (let arm = 0; arm < spiralArms; arm++) {
          const armAngle = rotAngle + (arm * Math.PI * 2) / spiralArms;
          ctx.beginPath();
          for (let t = 0; t < 1; t += 0.02) {
            const spiralR = currentR * 0.3 + currentR * t;
            const spiralA = armAngle + t * Math.PI * 2;
            const sx = this.position.x + Math.cos(spiralA) * spiralR;
            const sy = this.position.y + Math.sin(spiralA) * spiralR;
            if (t === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = `rgba(180, 100, 255, ${0.4 - birthProgress * 0.1})`;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
        }

        // 3) 중심 코어 (Event Horizon)
        const coreR = currentR * 0.4;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, coreR, 0, Math.PI * 2);
        const coreGrad = ctx.createRadialGradient(
          this.position.x,
          this.position.y,
          0,
          this.position.x,
          this.position.y,
          coreR,
        );
        coreGrad.addColorStop(0, "rgba(0, 0, 0, 0.95)");
        coreGrad.addColorStop(0.7, "rgba(10, 0, 20, 0.9)");
        coreGrad.addColorStop(1, "rgba(60, 0, 100, 0.5)");
        ctx.fillStyle = coreGrad;
        ctx.globalAlpha = 1.0;
        ctx.fill();

        // 4) 사건의 지평선 링 (보라색 네온)
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, coreR, 0, Math.PI * 2);
        ctx.strokeStyle = "#8A2BE2";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#8A2BE2";
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 5) 끌려들어가는 파티클
        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
          const seed = i * 213.7;
          const pTime = ((now + seed * 100) % 2000) / 2000; // 0~1
          const pAngle = rotAngle * 1.5 + seed + pTime * Math.PI * 3;
          const pDist = currentR * (1.2 - pTime); // 바깥에서 중심으로
          const px = this.position.x + Math.cos(pAngle) * pDist;
          const py = this.position.y + Math.sin(pAngle) * pDist;
          const pSize = 3 * (1 - pTime);

          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 150, 255, ${0.7 * (1 - pTime)})`;
          ctx.globalAlpha = 0.8;
          ctx.fill();
        }

        // 6) 외부 영역 범위 표시 (희미한 원)
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, currentR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(138, 43, 226, 0.3)";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
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
      // For TRAP, this is an explosion (Instant massive damage)
      // For others, it's a tick.

      // TRAP 폭발 시각 효과
      if (this.behavior === "TRAP") {
        const explosionRadius = Math.min(this.radius * 5, 150); // 최대 150으로 제한
        const explosionScale = explosionRadius / 50; // VFX 크기 조정
        VFXFactory.createExplosion(this.position.x, this.position.y, this.type, 30, explosionScale);
      }

      const nearby = spatialGrid.getNearbyEnemies(this.position.x, this.position.y, this.radius + 100) as Enemy[];

      if (this.behavior === "VORTEX") {
        // VORTEX에서는 끌어당기기가 update()에서 처리됨, 여기서는 틱 데미지만
      }

      // TRAP 폭발 범위 (레벨업으로 과도하게 커지지 않도록 제한)
      const damageRadius = this.behavior === "TRAP" ? Math.min(this.radius * 5, 150) : this.radius;

      // 데미지 입히기
      nearby.forEach(enemy => {
        if (enemy.isExpired) return;
        const dx = enemy.position.x - this.position.x;
        const dy = enemy.position.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 적의 히트박스(대략 20)를 고려하여 판정
        const hitRadius = damageRadius + 10; // 여유분을 줄여 이펙트와 일치시킴

        if (dist <= hitRadius) {
          // [FLAME_CONE] 부채꼴 각도 체크
          if (this.behavior === "FLAME_CONE") {
            const angle = Math.atan2(dy, dx);
            const facing = this.coneAngle || 0;
            const spread = this.coneSpread || Math.PI / 4;

            // 각도 차이 계산 (최단 경로)
            let diff = Math.abs(angle - facing);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;

            // 정확한 판정: 이펙트와 일치하도록 spread / 2 사용
            if (dist > 30 && diff > spread / 2) return;
          }

          // 1. 데미지 적용 (방어력 계산)
          const def = (enemy as any).defense || 0;
          // Note: this.damage now already includes the unified multiplier from weaponSystem
          const finalDamage = Math.max(1, this.damage - def);

          enemy.hp -= finalDamage;

          // 2. 데미지 텍스트 표시
          damageTextManager.show(enemy.position.x, enemy.position.y, finalDamage, finalDamage > 100);

          // 3. 중독 상태 효과 적용 (보라색 틴트용)
          // 기존 중독 효과 확인
          if (this.type === ElementType.POISON) {
            // ... Poison Logic ...
            const existingPoison = enemy.statusEffects.find(e => e.type === ("POISON" as any));
            // scaled damage * 0.3
            const poisonDamage = Math.max(1, Math.floor(this.damage * 0.3));

            if (existingPoison) {
              existingPoison.duration = 2000;
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

          // 4. ICE 상태 효과 적용 (빙결/둔화)
          if (this.type === ElementType.ICE) {
            const chillAmount = this.chillAmount || 0.3;
            const chillDuration = this.chillDuration || 3000;
            const freezeDuration = this.freezeDuration || 0;

            // 빙결
            if (freezeDuration > 0) {
              const existingFreeze = enemy.statusEffects.find(eff => eff.type === ("FREEZE" as any));
              if (existingFreeze) {
                existingFreeze.duration = Math.max(existingFreeze.duration, freezeDuration);
              } else {
                enemy.statusEffects.push({
                  type: "FREEZE" as any,
                  damage: 0,
                  duration: freezeDuration,
                  lastTick: Date.now(),
                  tickInterval: 999999,
                });
              }
            }

            // 둔화
            const existingChill = enemy.statusEffects.find(eff => eff.type === ("CHILL" as any));
            if (existingChill) {
              existingChill.duration = Math.max(existingChill.duration, chillDuration);
              if (chillAmount > (existingChill.value || 0)) existingChill.value = chillAmount;
            } else {
              enemy.statusEffects.push({
                type: "CHILL" as any,
                damage: 0,
                duration: chillDuration,
                lastTick: Date.now(),
                tickInterval: 999999,
                value: chillAmount,
              });
            }
          }
        }
      });
    },
  } as Area & { applyEffect: () => void }; // 타입 단언으로 메서드 추가 인식 시김
};
