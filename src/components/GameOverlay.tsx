import React, { useState, useEffect, useCallback, memo } from "react";
import { GameUI } from "./GameUI";
import { DebugUI } from "./debug/DebugUI";
import { StatsUI } from "./GameStatsUI";
import { VirtualJoystick } from "@/components/controls/VirtualJoystick";
import { getLevelUpState } from "@/game/managers/state";
import { setJoystickDirection } from "@/engine/systems/input";
import { Card } from "@/game/systems/cardSystem";

interface GameOverlayProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onExitGame: () => void;
}

interface LevelUpState {
  isLevelUpPending: boolean;
  levelUpChoices: Card[];
  levelUpCounter: number;
}

export const GameOverlay: React.FC<GameOverlayProps> = memo(({ isPaused, onPause, onResume, onExitGame }) => {
  const [levelUpState, setLevelUpState] = useState<LevelUpState>({
    isLevelUpPending: false,
    levelUpChoices: [],
    levelUpCounter: 0,
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      const lvlState = getLevelUpState();

      setLevelUpState(prev => {
        if (prev.isLevelUpPending !== lvlState.isLevelUpPending || prev.levelUpCounter !== lvlState.levelUpCounter) {
          return { ...lvlState };
        }
        return prev;
      });
    }, 100); // 레벨업 상태는 빠르게 체크

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
