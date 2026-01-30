import { memo } from "react";
import { PlayerStats } from "@/game/types";
import "@/styles/menu.css";

interface PauseMenuProps {
  stats: PlayerStats | null;
  onRecipes: () => void;
  onSettings: () => void;
  onResume: () => void;
}

export const PauseMenu = memo(({ stats, onRecipes, onSettings, onResume }: PauseMenuProps) => {
  return (
    <div className="pause-menu-overlay">
      <div className="pause-menu-content">
        <h1 className="pause-title">PAUSED</h1>

        <div className="pause-stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="sc-label">HEALTH</span>
              <span className="sc-value">
                {Math.ceil(stats?.hp || 0)} / {stats?.maxHp}
              </span>
            </div>
            <div className="stat-card">
              <span className="sc-label">ATTACK</span>
              <span className="sc-value">{(stats?.atk || 1).toFixed(1)}x</span>
            </div>
            <div className="stat-card">
              <span className="sc-label">DEFENSE</span>
              <span className="sc-value">{stats?.def}</span>
            </div>
            <div className="stat-card">
              <span className="sc-label">FIRE RATE</span>
              <span className="sc-value">{(stats?.fireRate || 1).toFixed(1)}x</span>
            </div>
          </div>
        </div>

        <div className="pause-button-list">
          <button className="menu-btn primary" onClick={onResume}>
            <span className="btn-icon">▶</span> CONTINUE
          </button>
          <button className="menu-btn" onClick={onRecipes}>
            <span className="btn-icon">📜</span> RECIPES
          </button>
          <button className="menu-btn" onClick={onSettings}>
            <span className="btn-icon">⚙️</span> SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
});
