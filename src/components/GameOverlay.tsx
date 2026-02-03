import React, { useState, useEffect, useCallback, memo } from "react";
import { GameUI } from "./GameUI";
import { DebugUI } from "./debug/DebugUI";
import { StatsUI } from "./GameStatsUI";
import { VirtualJoystick } from "@/components/controls/VirtualJoystick";
import { getLevelUpState } from "@/game/managers/state";
import { setJoystickDirection } from "@/engine/systems/input";
import { Card } from "@/game/systems/cardSystem";
import * as CONFIG from "@/game/config/constants";

interface GameOverlayProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onExitGame: () => void;
}

interface LevelUpState {
  isLevelUpPending: boolean;
  levelUpChoices: Card[];
}

export const GameOverlay: React.FC<GameOverlayProps> = memo(({ isPaused, onPause, onResume, onExitGame }) => {
  const [levelUpState, setLevelUpState] = useState<LevelUpState>({
    isLevelUpPending: false,
    levelUpChoices: [],
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const lvlState = getLevelUpState();

      setLevelUpState(prev => {
        if (prev.isLevelUpPending !== lvlState.isLevelUpPending) {
          return { ...lvlState };
        }
        return prev;
      });
    }, CONFIG.SCORE_UPDATE_INTERVAL);

    return () => clearInterval(updateInterval);
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    setJoystickDirection(x, y);
  }, []);

  return (
    <>
      <GameUI
        isPaused={isPaused}
        onPause={onPause}
        onResume={onResume}
        onExitGame={onExitGame}
        levelUpState={levelUpState}
      />
      <StatsUI stats={null} />
      <DebugUI stats={null} />
      <VirtualJoystick onMove={handleJoystickMove} />
    </>
  );
});
