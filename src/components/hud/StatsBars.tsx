import { useState, useEffect, memo } from "react";
import { getPlayerStats } from "@/game/managers/state";
import "@/styles/hud.css";

export const StatsBars = memo(() => {
  const [stats, setStats] = useState(() => {
    const s = getPlayerStats();
    return s ? { ...s } : null;
  });

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(() => {
      if (!isMounted) return;
      const current = getPlayerStats();
      if (!current) return;

      setStats(prev => {
        // [핵심] 모든 수치를 비교해서 하나라도 다를 때만 업데이트를 승인함
        // 이전 상태(prev)를 그대로 반환하면 리액트는 렌더링을 아예 시도하지 않음
        if (
          prev &&
          prev.hp === current.hp &&
          prev.maxHp === current.maxHp &&
          prev.atk === current.atk &&
          prev.def === current.def &&
          prev.fireRate === current.fireRate
        ) {
          return prev;
        }
        return { ...current };
      });
    }, 150); // 0.15초마다 체크 (렉 감소)

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
