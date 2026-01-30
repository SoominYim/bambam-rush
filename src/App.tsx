import { useEffect, useRef, useState } from "react";
import { GameUI } from "./components/GameUI";
import { startGame } from "./engine/loop";
import { getScore } from "./game/gameState";
import { initGameState } from "./game/gameState";
import { createPlayer } from "./game/entities/player";
import { initInput } from "./engine/input";
import "./App.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 게임 초기화
    const player = createPlayer(25000, 25000); // 무한 맵 중앙에서 시작
    initGameState(player);
    initInput();

    // 기존 커스텀 엔진 시작
    startGame(ctx);

    // 점수 업데이트 루프 (성능 최적화)
    const scoreInterval = setInterval(() => {
      setScore(getScore());
    }, 500); // 100ms에서 500ms로 변경

    // 리사이즈 핸들러
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(scoreInterval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePause = () => {
    setIsPaused(true);
    const { setPaused } = require("./engine/input");
    setPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    const { setPaused } = require("./engine/input");
    setPaused(false);
  };

  return (
    <div className="app">
      <canvas ref={canvasRef} id="game-canvas" />
      <GameUI score={score} isPaused={isPaused} onPause={handlePause} onResume={handleResume} />
    </div>
  );
}

export default App;
