import React, { useState, memo, useEffect } from "react";
import { getPlayer, addPlayerXP, getPlayerStats } from "@/game/managers/state";
import { addWeapon } from "@/game/systems/cardSystem";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import { PlayerStats } from "@/game/types";

interface DebugUIProps {
  stats?: PlayerStats | null;
}

export const DebugUI: React.FC<DebugUIProps> = memo(({ stats: initialStats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState(initialStats || getPlayerStats());
  const [selectedWeaponId, setSelectedWeaponId] = useState("W01");

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const current = getPlayerStats();
      if (current) {
        setStats({ ...current });
      }
    }, 100); // Very fast poll for debug
    return () => clearInterval(interval);
  }, [isOpen]);

  const player = getPlayer();
  if (!player) return null;

  const displayStats = stats || player.stats;

  const style: React.CSSProperties = {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "rgba(10, 10, 20, 0.95)",
    color: "#fff",
    padding: "8px",
    borderRadius: "8px",
    zIndex: 9999,
    fontSize: "11px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    width: isOpen ? "220px" : "auto",
    maxHeight: "90vh",
    overflowY: "auto",
    border: "1px solid rgba(100, 255, 218, 0.3)",
    pointerEvents: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  };

  const btnStyle: React.CSSProperties = {
    fontSize: "10px",
    padding: "4px",
    cursor: "pointer",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    borderRadius: "4px",
  };

  if (!isOpen) {
    return (
      <button style={style} onClick={() => setIsOpen(true)}>
        🛠️ Debug Mode
      </button>
    );
  }

  return (
    <div style={style}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "4px",
        }}
      >
        <strong style={{ color: "#64ffda" }}>DEBUG MENU</strong>
        <button style={{ ...btnStyle, border: "none", background: "transparent" }} onClick={() => setIsOpen(false)}>
          ✖
        </button>
      </div>

      <div style={{ marginBottom: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        <div>Lv: {displayStats.level}</div>
        <div>
          XP: {Math.floor(displayStats.xp)}/{displayStats.maxXp}
        </div>
        <div>
          HP: {Math.floor(displayStats.hp)}/{displayStats.maxHp}
        </div>
        <div>ATK: {displayStats.atk.toFixed(2)}</div>
        <div>SPD: {(displayStats.speed || 1).toFixed(2)}</div>
        <div>REG: {displayStats.hpRegen.toFixed(1)}/s</div>
        <div>MAG: {displayStats.pickupRange.toFixed(0)}</div>
        <div>PWR: {displayStats.magnetPower.toFixed(0)}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ fontWeight: "bold", fontSize: "10px", color: "#aaa" }}>CORE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          <button style={btnStyle} onClick={() => addPlayerXP(100)}>
            +100 XP
          </button>
          <button style={btnStyle} onClick={() => addPlayerXP(player.stats.maxXp)}>
            Level Up!
          </button>
          <button style={btnStyle} onClick={() => (player.stats.hp = player.stats.maxHp)}>
            Full Heal
          </button>
          <button style={btnStyle} onClick={() => (player.stats.maxHp += 50)}>
            +50 MaxHP
          </button>
        </div>

        <div style={{ fontWeight: "bold", fontSize: "10px", color: "#aaa", marginTop: "4px" }}>STATS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          <button style={btnStyle} onClick={() => (player.stats.atk += 0.2)}>
            +0.2 ATK
          </button>
          <button style={btnStyle} onClick={() => (player.stats.speed = (player.stats.speed || 1) + 0.1)}>
            +0.1 SPD
          </button>
          <button style={btnStyle} onClick={() => (player.stats.hpRegen += 1)}>
            +1.0 REG
          </button>
          <button style={btnStyle} onClick={() => (player.stats.fireRate += 0.1)}>
            +0.1 FireRate
          </button>
          <button style={btnStyle} onClick={() => (player.stats.pickupRange += 50)}>
            +50 Magnet
          </button>
          <button style={btnStyle} onClick={() => (player.stats.magnetPower += 100)}>
            +100 Power
          </button>
        </div>

        <div style={{ fontWeight: "bold", fontSize: "10px", color: "#aaa", marginTop: "4px" }}>WEAPONS</div>
        <select
          value={selectedWeaponId}
          onChange={e => setSelectedWeaponId(e.target.value)}
          style={{
            width: "100%",
            background: "#222",
            color: "#fff",
            padding: "4px",
            fontSize: "10px",
            borderRadius: "4px",
          }}
        >
          {Object.values(WEAPON_REGISTRY).map(w => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.id})
            </option>
          ))}
        </select>
        <button
          style={{ ...btnStyle, background: "#64ffda", color: "#000", fontWeight: "bold" }}
          onClick={() => addWeapon(selectedWeaponId)}
        >
          ADD WEAPON
        </button>
      </div>
    </div>
  );
});
