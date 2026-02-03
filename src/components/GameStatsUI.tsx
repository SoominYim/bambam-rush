import React, { memo, useState, useEffect } from "react";
import { PlayerStats } from "@/game/types";
import { getPlayerStats } from "@/game/managers/state";

interface StatsUIProps {
  stats: PlayerStats | null;
}

export const StatsUI: React.FC<StatsUIProps> = memo(({ stats: initialStats }) => {
  const [stats, setStats] = useState(initialStats || getPlayerStats());

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getPlayerStats();
      if (!current) return;
      // Always clone to ensure we catch any internal property mutations
      setStats({ ...current });
    }, 100);
    return () => clearInterval(interval);
  }, []);
  if (!stats) return null;

  return (
    <div className="detail-stats-overlay">
      <h3>Player Stats</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px" }}>
        <span>❤️ HP:</span>
        <span>
          {Math.floor(stats.hp)} / {stats.maxHp}
        </span>

        <span>⚔️ ATK:</span>
        <span>{stats.atk.toFixed(2)}</span>

        <span>🛡️ DEF:</span>
        <span>{stats.def.toFixed(1)}</span>

        <span>⚡ Atk Spd:</span>
        <span>{stats.fireRate.toFixed(2)}x</span>

        <span>🏃 Move Spd:</span>
        <span>{(stats.speed || 1.0).toFixed(2)}x</span>

        <span>❤️ Regen:</span>
        <span>{stats.hpRegen.toFixed(1)}/s</span>

        <span>🧲 Range:</span>
        <span>{stats.pickupRange.toFixed(0)}</span>

        <span>🧲 Power:</span>
        <span>{stats.magnetPower.toFixed(0)}</span>
      </div>
    </div>
  );
});
