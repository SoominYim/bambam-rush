import React, { useEffect, useState } from "react";
import { getPlayerStats } from "@/game/managers/state";

export const StatsUI: React.FC = () => {
  const [stats, setStats] = useState(getPlayerStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...getPlayerStats()! });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const style: React.CSSProperties = {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0, 0, 0, 0.7)",
    padding: "15px",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    pointerEvents: "none", // Click through
    zIndex: 100,
  };

  return (
    <div style={style}>
      <h3 style={{ margin: "0 0 10px 0", borderBottom: "1px solid #555", paddingBottom: "5px" }}>Player Stats</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 20px" }}>
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
      </div>
    </div>
  );
};
