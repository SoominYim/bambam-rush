import { memo } from "react";
import { getPlayerStats } from "@/game/managers/state";
import "@/styles/menu.css";

interface PauseMenuProps {
  onRecipes: () => void;
  onSettings: () => void;
  onResume: () => void;
  onExit: () => void;
}

export const PauseMenu = memo(({ onRecipes, onSettings, onResume, onExit }: PauseMenuProps) => {
  const stats = getPlayerStats();
  return (
    <div className="pause-menu-overlay">
      <div className="pause-menu-content">
        <h1 className="pause-title">일시정지</h1>

        <div className="pause-stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="sc-label">체력</span>
              <span className="sc-value">
                {Math.ceil(stats?.hp || 0)} / {stats?.maxHp}
              </span>
            </div>
            <div className="stat-card">
              <span className="sc-label">공격력</span>
              <span className="sc-value">{(stats?.atk || 1).toFixed(1)}x</span>
            </div>
            <div className="stat-card">
              <span className="sc-label">방어력</span>
              <span className="sc-value">{stats?.def}</span>
            </div>
            <div className="stat-card">
              <span className="sc-label">공격 속도</span>
              <span className="sc-value">{(stats?.fireRate || 1).toFixed(1)}x</span>
            </div>
          </div>
        </div>

        <div className="pause-button-list">
          <button className="menu-btn primary" onClick={onResume}>
            <span className="btn-icon">▶</span> 계속하기
          </button>
          <button className="menu-btn" onClick={onRecipes}>
            <span className="btn-icon">📜</span> 도감
          </button>
          <button className="menu-btn" onClick={onSettings}>
            <span className="btn-icon">⚙️</span> 설정
          </button>
          <button className="menu-btn danger" onClick={onExit}>
            <span className="btn-icon">🚪</span> 나가기
          </button>
        </div>
      </div>
    </div>
  );
});
