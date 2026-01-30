import { useEffect, useRef, useState, useCallback } from "react";
import { GameUI } from "./components/GameUI";
import { VirtualJoystick } from "./components/VirtualJoystick";
import { startGame } from "./engine/loop";
import { getScore } from "./game/gameState";
import { initGameState } from "./game/gameState";
import { createPlayer } from "./game/entities/player";
import { initInput, setPaused, setJoystickDirection } from "./engine/input";
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

    // 점수 업데이트 (requestAnimationFrame 사용으로 성능 최적화)
    let lastScoreUpdate = 0;
    const updateScore = (timestamp: number) => {
      if (timestamp - lastScoreUpdate > 1000) {
        // 1초마다 업데이트로 변경
        const currentScore = getScore();
        setScore(prevScore => {
          // 스코어가 실제로 변경되었을 때만 업데이트
          if (prevScore !== currentScore) {
            return currentScore;
          }
          return prevScore;
        });
        lastScoreUpdate = timestamp;
      }
      requestAnimationFrame(updateScore);
    };
    const scoreAnimationId = requestAnimationFrame(updateScore);

    // 리사이즈 핸들러
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(scoreAnimationId);
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
      <GameUI score={score} isPaused={isPaused} onPause={handlePause} onResume={handleResume} />
      <VirtualJoystick onMove={handleJoystickMove} />
    </div>
  );
}

export default App;
