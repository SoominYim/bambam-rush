import React, { useRef, useEffect } from "react";
import { drawCharacter } from "@/game/utils/characterRenderer";

interface CharacterPreviewProps {
  characterId: string;
  size?: number;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ characterId, size = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High resolution canvas (3x scale)
    const scale = 3;
    const canvasSize = size * scale;

    // Only update canvas dimensions if they've changed to avoid clearing and jittering
    if (canvas.width !== canvasSize) {
      canvas.width = canvasSize;
      canvas.height = canvasSize;
    }

    // Clear and reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.scale(scale, scale);

    // Draw Character
    // Use a safe padding-aware scale. 0.35 * size gives a radius that fits (diameter ~ 0.7 * size)
    // Centered at (size/2, size/2 + offset)
    drawCharacter(ctx, size / 2, size / 2 + size * 0.05, characterId, size * 0.35);
  }, [characterId, size]);

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
