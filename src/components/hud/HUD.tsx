import { memo } from "react";
import { Timer } from "./Timer";
import { ScoreDisplay } from "./ScoreDisplay";
import { StatsBars } from "./StatsBars";
import { GoldDisplay } from "./GoldDisplay";
import { XPBarBottom } from "./XPBarBottom";
import "@/styles/hud.css";

interface HUDProps {
  isPaused: boolean;
  onPauseToggle: () => void;
}

export const HUD = memo(({ isPaused, onPauseToggle }: HUDProps) => {
  return (
    <>
      <div className="game-hud">
        {/* 1. Left Group: Stats & Score */}
        <div className="hud-left">
          <StatsBars />
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <ScoreDisplay />
            <GoldDisplay />
          </div>
        </div>

        {/* 2. Center: Timer & Pause Button below */}
        <div className="hud-center-top">
          <Timer />
          <button className="pause-btn" onClick={onPauseToggle} title={isPaused ? "Resume" : "Pause"}>
            {isPaused ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 3. Bottom: Global XP Bar */}
      <XPBarBottom />
    </>
  );
});
