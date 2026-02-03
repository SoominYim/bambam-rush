import { useEffect, useRef, useState, useCallback } from "react";
import { GameUI } from "./components/GameUI";
import { DebugUI } from "./components/debug/DebugUI";
import { StatsUI } from "./components/GameStatsUI";
import { VirtualJoystick } from "@/components/controls/VirtualJoystick";
import { startGame, stopGame } from "@/engine/core/gameLoop";
import { getScore, getPlayerStats, getLevelUpState, getGameTime } from "@/game/managers/state";
import { initGameState } from "@/game/managers/state";
import { createPlayer } from "@/game/entities/player";
import { initInput, setPaused, setJoystickDirection } from "@/engine/systems/input";
import { PlayerStats } from "@/game/types";
import { Card } from "@/game/systems/cardSystem";
import { MainHub } from "./components/menu/MainHub";
import { ElementType } from "@/game/types";
import { createTailSegment } from "@/game/entities/player";
import { addTailSegment } from "@/game/managers/state";
import * as CONFIG from "@/game/config/constants";
import { CHARACTER_REGISTRY } from "@/game/config/characterRegistry";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import "@/styles/app.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
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

      const currentTime = getGameTime();
      setGameTime(prev => (Math.floor(prev) !== Math.floor(currentTime) ? currentTime : prev));

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

  const handleCharacterSelect = useCallback((characterId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get character definition
    const charDef = CHARACTER_REGISTRY[characterId];
    if (!charDef) return;

    // Initialize Game with selected character
    const player = createPlayer(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2, characterId);

    // Add starting weapon from character
    player.activeWeapons = [{ id: charDef.startWeaponId, level: 1, timer: 0, lastFired: 0 }];

    // Add starting passive from character
    player.passives = [{ id: charDef.startPassiveId, level: 1 }];

    initGameState(player);
    setPlayerStats(player.stats);
    initInput();

    // Add initial tail segment (MUST be after initGameState which clears tail)
    // Get the weapon's first tag as the element type for visual
    const weaponDef = WEAPON_REGISTRY[charDef.startWeaponId];
    const visualElement = weaponDef?.tags[0] || ElementType.PHYSICAL;
    const firstSegment = createTailSegment(0, visualElement);
    firstSegment.weaponId = charDef.startWeaponId; // Link visual to weapon
    addTailSegment(firstSegment);

    startGame(ctx);
    setIsGameStarted(true);
  }, []);

  return (
    <div className="app">
      <canvas ref={canvasRef} id="game-canvas" />

      {!isGameStarted && <MainHub onStartGame={handleCharacterSelect} />}

      {isGameStarted && (
        <>
          <GameUI
            score={score}
            gameTime={gameTime}
            isPaused={isPaused}
            playerStats={playerStats}
            onPause={handlePause}
            onResume={handleResume}
            levelUpState={levelUpState}
          />
          <StatsUI />
          <DebugUI />
          <VirtualJoystick onMove={handleJoystickMove} />
        </>
      )}
    </div>
  );
}

export default App;
