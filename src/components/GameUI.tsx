import { memo, useCallback, useState, useEffect } from "react";
import { HUD } from "@/components/hud/HUD";
import { Library } from "@/components/menu/Library";
import { PauseMenu } from "@/components/menu/PauseMenu";
import { SettingsModal } from "@/components/menu/SettingsModal";
import { ConfirmModal } from "@/components/menu/ConfirmModal";
import { LevelUpModal } from "@/components/menu/LevelUpModal";
import { Card } from "@/game/systems/cardSystem";

interface GameUIProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onExitGame: () => void;
  levelUpState?: { isLevelUpPending: boolean; levelUpChoices: Card[] };
}

type MenuState = "main" | "recipes" | "settings" | "confirm-exit";

export const GameUI = memo(({ isPaused, onPause, onResume, onExitGame, levelUpState }: GameUIProps) => {
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
  const showConfirmExit = useCallback(() => setActiveMenu("confirm-exit"), []);
  const backToMain = useCallback(() => setActiveMenu("main"), []);

  return (
    <>
      <HUD isPaused={isPaused} onPauseToggle={handlePauseToggle} />

      {levelUpState?.isLevelUpPending && <LevelUpModal choices={levelUpState.levelUpChoices} />}

      {isPaused && !levelUpState?.isLevelUpPending && (
        <>
          {activeMenu === "main" && (
            <PauseMenu onRecipes={showRecipes} onSettings={showSettings} onResume={onResume} onExit={showConfirmExit} />
          )}

          {activeMenu === "recipes" && <Library onClose={backToMain} />}

          {activeMenu === "settings" && <SettingsModal onBack={backToMain} />}

          {activeMenu === "confirm-exit" && (
            <ConfirmModal
              title="게임 종료"
              message="게임을 종료하고 메인 화면으로 나가시겠습니까?"
              onConfirm={onExitGame}
              onCancel={backToMain}
            />
          )}
        </>
      )}
    </>
  );
});
