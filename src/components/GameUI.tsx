import { memo, useCallback, useState, useEffect } from "react";
import { HUD } from "@/components/hud/HUD";
import { RecipeModal } from "@/components/menu/RecipeModal";
import { PauseMenu } from "@/components/menu/PauseMenu";
import { SettingsModal } from "@/components/menu/SettingsModal";
import { LevelUpModal } from "@/components/menu/LevelUpModal";
import { PlayerStats } from "@/game/types";
import { Card } from "@/game/systems/cardSystem";

interface GameUIProps {
  score: number;
  isPaused: boolean;
  playerStats: PlayerStats | null;
  onPause: () => void;
  onResume: () => void;
  levelUpState?: { isLevelUpPending: boolean; levelUpChoices: Card[] };
}

type MenuState = "main" | "recipes" | "settings";

export const GameUI = memo(({ score, isPaused, playerStats, onPause, onResume, levelUpState }: GameUIProps) => {
  const [activeMenu, setActiveMenu] = useState<MenuState>("main");

  // 일시정지 해제될 때 메뉴 상태를 메인으로 초기화
  useEffect(() => {
    if (!isPaused) {
      setActiveMenu("main");
    }
  }, [isPaused]);

  const handlePauseToggle = useCallback(() => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  }, [isPaused, onPause, onResume]);

  const showRecipes = useCallback(() => setActiveMenu("recipes"), []);
  const showSettings = useCallback(() => setActiveMenu("settings"), []);
  const backToMain = useCallback(() => setActiveMenu("main"), []);

  return (
    <>
      <HUD score={score} isPaused={isPaused} playerStats={playerStats} onPauseToggle={handlePauseToggle} />

      {levelUpState?.isLevelUpPending && <LevelUpModal choices={levelUpState.levelUpChoices} />}

      {isPaused && !levelUpState?.isLevelUpPending && (
        <>
          {activeMenu === "main" && (
            <PauseMenu stats={playerStats} onRecipes={showRecipes} onSettings={showSettings} onResume={onResume} />
          )}

          {activeMenu === "recipes" && <RecipeModal onClose={backToMain} />}

          {activeMenu === "settings" && <SettingsModal onBack={backToMain} />}
        </>
      )}
    </>
  );
});
