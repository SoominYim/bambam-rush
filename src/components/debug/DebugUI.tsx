import React, { useState, useEffect } from "react";
import { getPlayer, addPlayerXP } from "@/game/managers/state";

export const DebugUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Force update to see stats changing
  const [, setParam] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setParam(p => p + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  const player = getPlayer();
  if (!player) return null;

  const style: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.8)",
    color: "#fff",
    padding: "10px",
    borderRadius: "8px",
    zIndex: 9999,
    fontSize: "12px",
    fontFamily: "monospace",
    width: isOpen ? "200px" : "auto",
  };

  if (!isOpen) {
    return (
      <button style={style} onClick={() => setIsOpen(true)}>
        🛠️ Debug
      </button>
    );
  }

  return (
    <div style={style}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <strong>Debug Menu</strong>
        <button onClick={() => setIsOpen(false)}>X</button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div>Lv: {player.stats.level}</div>
        <div>
          HP: {Math.floor(player.stats.hp)} / {player.stats.maxHp}
        </div>
        <div>
          XP: {Math.floor(player.stats.xp)} / {player.stats.maxXp}
        </div>
        <div>ATK: {player.stats.atk.toFixed(1)}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <button onClick={() => addPlayerXP(100)}>+100 XP</button>
        <button onClick={() => addPlayerXP(player.stats.maxXp)}>Level Up!</button>

        <button
          onClick={() => {
            player.stats.hp = player.stats.maxHp;
          }}
        >
          Full Heal
        </button>

        <button
          onClick={() => {
            player.stats.atk += 0.1;
          }}
        >
          +0.1 ATK
        </button>

        <button
          onClick={() => {
            player.stats.atk = Math.max(1, player.stats.atk - 0.1);
          }}
        >
          -0.1 ATK
        </button>

        <button
          onClick={() => {
            player.stats.speed = (player.stats.speed || 1.0) + 0.1;
          }}
        >
          +Move Spd
        </button>

        <button
          onClick={() => {
            player.stats.fireRate = (player.stats.fireRate || 1.0) + 0.1;
          }}
        >
          +Atk Spd
        </button>
      </div>
    </div>
  );
};
