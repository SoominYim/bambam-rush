import { useEffect, useRef, useState, useCallback } from "react";
import { GameOverlay } from "./components/GameOverlay";
import { startGame, stopGame } from "@/engine/core/gameLoop";
import { initGameState } from "@/game/managers/state";
import { createPlayer } from "@/game/entities/player";
import { initInput, setPaused, disposeInput } from "@/engine/systems/input";
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
  const [isPaused, setIsPaused] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      stopGame();
      disposeInput();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(prev => {
      setPaused(!prev);
      return !prev;
    });
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setPaused(false);
  }, []);

  const handleCharacterSelect = useCallback((characterId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get character definition
    const charDef = CHARACTER_REGISTRY[characterId];
    if (!charDef) return;

    // Initialize Game with selected character (Encapsulated Registry Source)
    const player = createPlayer(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2, characterId);
    const startLevel = charDef.startLevel || 1;

    // 1. Equip all starting weapons defined in the registry
    player.activeWeapons = charDef.startWeaponIds.map(id => ({
      id,
      level: startLevel,
      timer: 0,
      lastFired: 0,
    }));

    // 2. Equip all starting passives defined in the registry
    player.passives = charDef.startPassiveIds.map(id => ({
      id,
      level: Math.min(startLevel, 5), // Passives usually cap at 5
    }));

    initGameState(player);
    initInput();

    // 3. Add tail segments for each starting weapon
    player.activeWeapons.forEach((w, idx) => {
      const weaponDef = WEAPON_REGISTRY[w.id];
      const visualElement = weaponDef?.tags[0] || ElementType.PHYSICAL;
      const segment = createTailSegment(idx, visualElement);
      segment.weaponId = w.id;
      addTailSegment(segment);
    });

    startGame(ctx);
    setIsGameStarted(true);
  }, []);

  const handleExitGame = useCallback(() => {
    stopGame();
    disposeInput();
    setIsGameStarted(false);
    setIsPaused(false);
    setPaused(false);
  }, []);

  return (
    <div className="app">
      <canvas ref={canvasRef} id="game-canvas" />

      {!isGameStarted && <MainHub onStartGame={handleCharacterSelect} />}

      {isGameStarted && (
        <GameOverlay isPaused={isPaused} onPause={handlePause} onResume={handleResume} onExitGame={handleExitGame} />
      )}
    </div>
  );
}

export default App;
