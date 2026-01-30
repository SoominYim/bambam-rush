import { memo } from "react";
import { PlayerStats } from "@/game/types";
import "@/styles/hud.css";

interface HUDProps {
  score: number;
  isPaused: boolean;
  playerStats: PlayerStats | null;
  onPauseToggle: () => void;
}

export const HUD = memo(({ score, isPaused, playerStats, onPauseToggle }: HUDProps) => {
  return (
    <div className="game-hud">
      <div className="hud-left">
        <div className="player-stats-bar">
          <div className="hp-bar-container">
            <div
              className="hp-bar-fill"
              style={{ width: `${((playerStats?.hp || 0) / (playerStats?.maxHp || 100)) * 100}%` }}
            />
            <span className="hp-text">
              {Math.ceil(playerStats?.hp || 0)} / {playerStats?.maxHp || 100}
            </span>
          </div>

          <div className="stats-mini">
            <div className="stat-item" title="Attack">
              <span className="stat-icon">⚔️</span>
              <span className="stat-value">{playerStats?.atk.toFixed(1)}</span>
            </div>
            <div className="stat-item" title="Defense">
              <span className="stat-icon">🛡️</span>
              <span className="stat-value">{playerStats?.def}</span>
            </div>
            <div className="stat-item" title="Attack Speed">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">{playerStats?.fireRate.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        <div className="score-container">
          <span className="score-label">SCORE</span>
          <span className="score-value">{score.toLocaleString()}</span>
        </div>

        <button className="pause-btn" onClick={onPauseToggle} title={isPaused ? "Resume" : "Pause"}>
          {isPaused ? (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
});
