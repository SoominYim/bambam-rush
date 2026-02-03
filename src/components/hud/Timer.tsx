import { useState, useEffect, memo } from "react";
import { getGameTime } from "@/game/managers/state";
import "@/styles/hud.css";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const Timer = memo(() => {
  const [time, setTime] = useState(Math.floor(getGameTime()));

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Math.floor(getGameTime());
      setTime(prev => (prev !== currentTime ? currentTime : prev));
    }, 200); // Poll frequently enough to be responsive but not too much
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="timer-container">
      <span className="timer-value">{formatTime(time)}</span>
    </div>
  );
});
Timer.displayName = "Timer";
