import { useEffect, useRef, useState, useCallback } from "react";
import { GameUI } from "./components/GameUI";
import { VirtualJoystick } from "@/components/controls/VirtualJoystick";
import { startGame, stopGame } from "@/engine/core/gameLoop";
import { getScore, getPlayerStats, getLevelUpState } from "@/game/managers/state";
import { initGameState } from "@/game/managers/state";
import { createPlayer } from "@/game/entities/player";
import { initInput, setPaused, setJoystickDirection } from "@/engine/systems/input";
import { PlayerStats } from "@/game/types";
import { Card } from "@/game/systems/cardSystem";
import { CharacterSelection } from "@/components/menu/CharacterSelection";
import { ElementType } from "@/game/types";
import { createTailSegment } from "@/game/entities/player";
import { addTailSegment } from "@/game/managers/state";
import * as CONFIG from "@/game/config/constants";
import "@/styles/app.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [levelUpState, setLevelUpState] = useState<{ isLevelUpPending: boolean; levelUpChoices: Card[] }>({
    isLevelUpPending: false,
    levelUpChoices: [],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 게임 초기화 (Moved to handleCharacterSelect)

    // 점수 및 스탯 업데이트 주기 관리
    const updateInterval = setInterval(() => {
      const currentScore = getScore();
      setScore(prev => (prev !== currentScore ? currentScore : prev));

      const stats = getPlayerStats();
      if (stats) setPlayerStats({ ...stats });

      const lvlState = getLevelUpState();
      setLevelUpState(prev => {
        if (prev.isLevelUpPending !== lvlState.isLevelUpPending) {
          return { ...lvlState };
        }
        return prev;
      });
    }, CONFIG.SCORE_UPDATE_INTERVAL);

    // 리사이즈 핸들러
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      stopGame(); // 이전 루프를 확실히 정지!
      clearInterval(updateInterval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(prev => {
      setPaused(!prev); // prev를 사용해서 올바른 값 전달
      return !prev;
    });
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setPaused(false);
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number) => {
    setJoystickDirection(x, y);
  }, []);

  const handleCharacterSelect = useCallback((element: ElementType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize Game with selected character
    const player = createPlayer(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
    initGameState(player);
    setPlayerStats(player.stats);
    initInput();

    // Add initial tail segment (MUST be after initGameState which clears tail)
    const firstSegment = createTailSegment(0, element);
    addTailSegment(firstSegment);

    startGame(ctx);
    setIsGameStarted(true);
  }, []);

  return (
    <div className="app">
      <canvas ref={canvasRef} id="game-canvas" />

      {!isGameStarted && <CharacterSelection onSelect={handleCharacterSelect} />}

      {isGameStarted && (
        <>
          <GameUI
            score={score}
            isPaused={isPaused}
            playerStats={playerStats}
            onPause={handlePause}
            onResume={handleResume}
            levelUpState={levelUpState}
          />
          <VirtualJoystick onMove={handleJoystickMove} />
        </>
      )}
    </div>
  );
}

export default App;
