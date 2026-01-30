import { useEffect, useRef, useState, useCallback } from "react";
import { GameUI } from "./components/GameUI";
import { VirtualJoystick } from "@/components/controls/VirtualJoystick";
import { startGame, stopGame } from "@/engine/core/gameLoop";
import { getScore, getPlayerStats } from "@/game/managers/state";
import { initGameState } from "@/game/managers/state";
import { createPlayer } from "@/game/entities/player";
import { initInput, setPaused, setJoystickDirection } from "@/engine/systems/input";
import { PlayerStats } from "@/game/types";
import * as CONFIG from "@/game/config/constants";
import "@/styles/app.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 게임 초기화
    const player = createPlayer(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2); // 무한 맵 중앙에서 시작
    initGameState(player);
    setPlayerStats(player.stats);
    initInput();

    // 기존 커스텀 엔진 시작
    startGame(ctx);

    // 점수 및 스탯 업데이트 주기 관리
    const updateInterval = setInterval(() => {
      const currentScore = getScore();
      setScore(prev => (prev !== currentScore ? currentScore : prev));

      const stats = getPlayerStats();
      if (stats) setPlayerStats({ ...stats });
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

  return (
    <div className="app">
      <canvas ref={canvasRef} id="game-canvas" />
      <GameUI
        score={score}
        isPaused={isPaused}
        playerStats={playerStats}
        onPause={handlePause}
        onResume={handleResume}
      />
      <VirtualJoystick onMove={handleJoystickMove} />
    </div>
  );
}

export default App;
