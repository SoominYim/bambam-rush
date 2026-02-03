import { useState, useEffect, memo } from "react";
import { getPlayerStats } from "@/game/managers/state";
import "@/styles/hud.css";

export const StatsBars = memo(() => {
  // Initialize with a clone to avoid reference comparison issues
  const [stats, setStats] = useState(() => {
    const s = getPlayerStats();
    return s ? { ...s } : null;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getPlayerStats();
      if (!current) return;
      setStats({ ...current });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="player-stats-bar">
      <div className="hp-bar-container">
        <div className="hp-bar-fill" style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }} />
        <span className="hp-text">
          {Math.ceil(stats.hp)} / {stats.maxHp}
        </span>
      </div>

      <div className="stats-mini">
        <div className="stat-item" title="Attack">
          <span className="stat-icon">⚔️</span>
          <span className="stat-value">{stats.atk.toFixed(1)}</span>
        </div>
        <div className="stat-item" title="Defense">
          <span className="stat-icon">🛡️</span>
          <span className="stat-value">{stats.def}</span>
        </div>
        <div className="stat-item" title="Atk Speed">
          <span className="stat-icon">⚡</span>
          <span className="stat-value">{stats.fireRate.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
});
StatsBars.displayName = "StatsBars";
