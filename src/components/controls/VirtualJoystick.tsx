import { useRef, useEffect, memo } from "react";
import "@/styles/joystick.css";

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick = memo(({ onMove }: VirtualJoystickProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isTouching = false;

    const handleStart = (e: TouchEvent | MouseEvent) => {
      isTouching = true;
      updatePosition(e);
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isTouching) return;
      updatePosition(e);
    };

    const handleEnd = () => {
      isTouching = false;
      if (handleRef.current) {
        handleRef.current.style.transform = `translate(-50%, -50%)`;
      }
      onMove(0, 0);
    };

    const updatePosition = (e: TouchEvent | MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      let dx = clientX - centerX;
      let dy = clientY - centerY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = rect.width / 2;

      if (distance > maxRadius) {
        dx = (dx / distance) * maxRadius;
        dy = (dy / distance) * maxRadius;
      }

      if (handleRef.current) {
        handleRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }

      onMove(dx / maxRadius, dy / maxRadius);
    };

    container.addEventListener("touchstart", handleStart);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
    container.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    return () => {
      container.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      container.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
    };
  }, [onMove]);

  return (
    <div ref={containerRef} className="joystick-container">
      <div ref={handleRef} className="joystick-handle" />
    </div>
  );
});
