// import * as CONFIG from "@/game/config/constants";
// import { ElementType } from "@/game/types";

/**
 * 기본 얼굴 그리기 (모든 캐릭터 공통)
 */
function drawBaseFace(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000000";
  ctx.stroke();
}

/**
 * 눈과 볼터치 그리기 (모든 캐릭터 공통)
 */
function drawFacialFeatures(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const eyeOffsetX = r * 0.35;
  const eyeOffsetY = -r * 0.1;
  const eyeSize = r * 0.15;

  ctx.fillStyle = "#000000";

  // 왼쪽 눈
  ctx.beginPath();
  ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // 오른쪽 눈
  ctx.beginPath();
  ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // 볼터치
  const blushOffsetX = r * 0.5;
  const blushOffsetY = r * 0.2;
  const blushSize = r * 0.12;

  ctx.fillStyle = "rgba(255, 100, 100, 0.4)";

  // 왼쪽 볼
  ctx.beginPath();
  ctx.arc(x - blushOffsetX, y + blushOffsetY, blushSize, 0, Math.PI * 2);
  ctx.fill();

  // 오른쪽 볼
  ctx.beginPath();
  ctx.arc(x + blushOffsetX, y + blushOffsetY, blushSize, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 캐릭터별 장식 렌더링 함수
 * 각 캐릭터의 독특한 외형을 정의합니다.
 */
type CharacterDecorator = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => void;

const characterDecorations: Record<string, CharacterDecorator> = {
  // 전사 - 투구 뿔
  BASIC: (ctx, x, y, r) => {
    ctx.fillStyle = "#BDC3C7";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";

    // 왼쪽 뿔
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.5);
    ctx.lineTo(x - r * 1.2, y - r * 1.2);
    ctx.lineTo(x - r * 0.3, y - r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 오른쪽 뿔
    ctx.beginPath();
    ctx.moveTo(x + r * 0.7, y - r * 0.5);
    ctx.lineTo(x + r * 1.2, y - r * 1.2);
    ctx.lineTo(x + r * 0.3, y - r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },

  // 화염 술사 - 불꽃 문양
  FIRE_MAGE: (ctx, x, y, r) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";

    // 이마에 불꽃
    ctx.beginPath();
    ctx.arc(x, y - r * 1.2, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#FF4500";
    ctx.fill();
    ctx.stroke();

    // 작은 불꽃 반짝임
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y - r * 1.1, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = "#FFA500";
    ctx.fill();
  },

  // 빙결 술사 - 얼음 왕관
  FROST_MAGE: (ctx, x, y, r) => {
    ctx.strokeStyle = "#00FFFF";
    ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
    ctx.lineWidth = 2;

    // 왕관 모양
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y - r * 0.8);
    ctx.lineTo(x - r * 0.3, y - r * 1.4);
    ctx.lineTo(x, y - r * 0.8);
    ctx.lineTo(x + r * 0.3, y - r * 1.4);
    ctx.lineTo(x + r * 0.6, y - r * 0.8);
    ctx.fill();
    ctx.stroke();
  },

  // 바람 사냥꾼 - 날개
  WIND_RANGER: (ctx, x, y, r) => {
    ctx.fillStyle = "#E8F5E9";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // 왼쪽 날개
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8, y);
    ctx.quadraticCurveTo(x - r * 2.2, y - r * 1.2, x - r * 1.0, y - r * 0.3);
    ctx.quadraticCurveTo(x - r * 1.5, y, x - r * 0.8, y);
    ctx.fill();
    ctx.stroke();

    // 오른쪽 날개
    ctx.beginPath();
    ctx.moveTo(x + r * 0.8, y);
    ctx.quadraticCurveTo(x + r * 2.2, y - r * 1.2, x + r * 1.0, y - r * 0.3);
    ctx.quadraticCurveTo(x + r * 1.5, y, x + r * 0.8, y);
    ctx.fill();
    ctx.stroke();
  },

  // 스피드스터 - 번개 문양
  SPEEDSTER: (ctx, x, y, r) => {
    ctx.fillStyle = "#FFD700";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // 번개 문양
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.3);
    ctx.lineTo(x - r * 0.3, y - r * 0.7);
    ctx.lineTo(x, y - r * 0.5);
    ctx.lineTo(x + r * 0.3, y - r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },

  // 탱커 - 방패 문양
  TANK: (ctx, x, y, r) => {
    ctx.fillStyle = "#9B59B6";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // 방패
    ctx.beginPath();
    ctx.arc(x, y - r * 0.9, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 방패 십자가
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.25, y - r * 0.9);
    ctx.lineTo(x + r * 0.25, y - r * 0.9);
    ctx.moveTo(x, y - r * 1.15);
    ctx.lineTo(x, y - r * 0.65);
    ctx.stroke();
  },

  // 엘리멘탈리스트 - 별 문양
  ELEMENTALIST: (ctx, x, y, r) => {
    ctx.fillStyle = "#E056FD";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    const starSize = r * 0.4;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * starSize;
      const py = y - r * 1.1 + Math.sin(angle) * starSize;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },

  // 갬블러 - 클로버 문양
  GAMBLER: (ctx, x, y, r) => {
    ctx.fillStyle = "#1ABC9C";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // 클로버 4잎
    const cloverSize = r * 0.2;
    const positions = [
      { x: x, y: y - r * 1.2 }, // 위
      { x: x - cloverSize, y: y - r * 1.0 }, // 왼쪽
      { x: x + cloverSize, y: y - r * 1.0 }, // 오른쪽
      { x: x, y: y - r * 0.8 }, // 아래
    ];

    positions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, cloverSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  },

  // GOD (수빡이) - 메이플 운영자 모자 & 황금 아우라
  GOD: (ctx, x, y, r) => {
    // 1. 모자 (Maple GM Hat 스타일)
    // 모자 챙
    ctx.fillStyle = "#E74C3C"; // 빨간색
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.9, r * 1.1, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 모자 몸체
    ctx.beginPath();
    ctx.arc(x, y - r * 1.1, r * 0.7, Math.PI, 0);
    ctx.lineTo(x + r * 0.7, y - r * 0.9);
    ctx.lineTo(x - r * 0.7, y - r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // GM 텍스트
    ctx.fillStyle = "#F1C40F"; // 노란색
    ctx.font = `bold ${r * 0.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GM", x, y - r * 1.2);

    // 2. 황금 아우라 (반짝임)
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FFD700";
  },
};

/**
 * 캐릭터를 Canvas에 그립니다.
 * 모든 캐릭터는 동일한 기본 얼굴을 가지며, 각자의 독특한 장식으로 차별화됩니다.
 *
 * @param ctx - Canvas 2D 렌더링 컨텍스트
 * @param x - 캐릭터 중심 X 좌표
 * @param y - 캐릭터 중심 Y 좌표
 * @param characterId - 캐릭터 ID (예: "BASIC", "FIRE_MAGE")
 * @param headRadius - 머리 반지름 (기본값: 15)
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  characterId: string,
  headRadius: number = 15,
): void {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  const r = headRadius;

  // 1. 캐릭터별 장식 (얼굴 뒤에 그려야 하는 것들 - 예: 날개)
  const decorator = characterDecorations[characterId];
  if (decorator && characterId === "WIND_RANGER") {
    // 날개는 얼굴 뒤에 그려야 함
    decorator(ctx, x, y, r);
  }

  // 2. 기본 얼굴 (모든 캐릭터 공통)
  drawBaseFace(ctx, x, y, r);

  // 3. 캐릭터별 장식 (얼굴 위에 그려야 하는 것들)
  if (decorator && characterId !== "WIND_RANGER") {
    decorator(ctx, x, y, r);
  }

  // 4. 눈, 볼터치 (공통)
  drawFacialFeatures(ctx, x, y, r);

  ctx.restore();
}
