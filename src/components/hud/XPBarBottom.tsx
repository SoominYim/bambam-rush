import { useState, useEffect, memo } from "react";
import { getPlayerStats } from "@/game/managers/state";
import "@/styles/hud.css";

export const XPBarBottom = memo(() => {
  const [stats, setStats] = useState(() => {
    const s = getPlayerStats();
    return s ? { ...s } : null;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getPlayerStats();
      if (!current) return;

      setStats(prev => {
        if (!prev) return { ...current };
        if (prev.xp === current.xp && prev.maxXp === current.maxXp && prev.level === current.level) {
          return prev;
        }
        return { ...current };
      });
    }, 100); // Faster update for smooth feel
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const xpPercentage = (stats.xp / stats.maxXp) * 100;

  return (
    <div className="xp-bar-bottom-fixed">
      <div className="xp-bar-fill-bottom" style={{ width: `${xpPercentage}%` }} />
      <div className="xp-bar-info-bottom">
        <span className="xp-level-text">Lv.{stats.level}</span>
        <span className="xp-val-text">
          {Math.floor(stats.xp)} / {stats.maxXp}
        </span>
      </div>
    </div>
  );
});

XPBarBottom.displayName = "XPBarBottom";
