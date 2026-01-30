import { useEffect, useRef, useState, memo } from "react";
import "./VirtualJoystick.css";

interface JoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick = memo(({ onMove }: JoystickProps) => {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!baseRef.current) return;

      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      touchId.current = touch.identifier;
      setActive(true);

      updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchId.current === null || !baseRef.current) return;

      const touch = Array.from(e.touches).find(t => t.identifier === touchId.current);
      if (!touch) return;

      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEnded = Array.from(e.changedTouches).some(t => t.identifier === touchId.current);

      if (touchEnded) {
        touchId.current = null;
        setActive(false);
        setPosition({ x: 0, y: 0 });
        onMove(0, 0);
      }
    };

    // Mouse events for desktop testing
    const handleMouseDown = (e: MouseEvent) => {
      if (!baseRef.current) return;

      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      touchId.current = -1; // Indicate mouse mode
      setActive(true);

      updateJoystick(e.clientX - centerX, e.clientY - centerY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (touchId.current !== -1 || !baseRef.current) return;

      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      updateJoystick(e.clientX - centerX, e.clientY - centerY);
    };

    const handleMouseUp = () => {
      if (touchId.current === -1) {
        touchId.current = null;
        setActive(false);
        setPosition({ x: 0, y: 0 });
        onMove(0, 0);
      }
    };

    const updateJoystick = (deltaX: number, deltaY: number) => {
      const maxDistance = 50; // 최대 이동 거리
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > maxDistance) {
        deltaX = (deltaX / distance) * maxDistance;
        deltaY = (deltaY / distance) * maxDistance;
      }

      setPosition({ x: deltaX, y: deltaY });

      // 정규화된 값 전달 (-1 ~ 1)
      const normalizedX = deltaX / maxDistance;
      const normalizedY = deltaY / maxDistance;
      onMove(normalizedX, normalizedY);
    };

    const base = baseRef.current;
    if (base) {
      base.addEventListener("touchstart", handleTouchStart);
      base.addEventListener("mousedown", handleMouseDown as any);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("touchcancel", handleTouchEnd);
      document.addEventListener("mousemove", handleMouseMove as any);
      document.addEventListener("mouseup", handleMouseUp as any);
    }

    return () => {
      if (base) {
        base.removeEventListener("touchstart", handleTouchStart);
        base.removeEventListener("mousedown", handleMouseDown as any);
      }
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
      document.removeEventListener("mousemove", handleMouseMove as any);
      document.removeEventListener("mouseup", handleMouseUp as any);
    };
  }, [onMove]);

  return (
    <div className="joystick-container">
      <div ref={baseRef} className={`joystick-base ${active ? "active" : ""}`}>
        <div
          className="joystick-stick"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        />
      </div>
    </div>
  );
});
