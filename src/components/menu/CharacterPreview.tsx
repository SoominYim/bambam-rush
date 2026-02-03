import React, { useRef, useEffect } from "react";
import { drawCharacter } from "@/game/utils/characterRenderer";

interface CharacterPreviewProps {
  characterId: string;
  size?: number;
  isSelected?: boolean;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ characterId, size = 80, isSelected = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 고해상도 캔버스 (실제 크기의 3배)
    const scale = 3;
    const canvasSize = size * scale;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const headSize = size * 0.6;
    const headRadius = headSize / 2;

    // Clear
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Scale up for high resolution
    ctx.scale(scale, scale);

    // 캐릭터 렌더링 (중앙 집중화된 로직 사용)
    drawCharacter(ctx, size / 2, size / 2, characterId, headRadius);

    // 선택 시 하이라이트 효과 (파란 테두리 외곽선)
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, headRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#64ffda";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }, [characterId, size, isSelected]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: "auto",
      }}
    />
  );
};

export default CharacterPreview;
