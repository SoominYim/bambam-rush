import React, { useState, useRef, useEffect } from "react";
import { CHARACTER_REGISTRY } from "@/game/config/characterRegistry";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import { CharacterPreview } from "./CharacterPreview";
import { Library } from "./Library";
import "@/styles/mainHub.css";

import { useEasterEgg } from "@/game/systems/easterEgg";

interface MainHubProps {
  onStartGame: (characterId: string) => void;
}

export const MainHub: React.FC<MainHubProps> = ({ onStartGame }) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("BASIC");
  const [isGodRevealed, setIsGodRevealed] = useState(false);

  // States for Drag-to-Scroll (Unified Pointer Events)
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const [dragMoved, setDragMoved] = useState(false);

  // Easter Egg logic
  useEasterEgg(() => {
    setIsGodRevealed(true);
    setSelectedCharacter("GOD");
    console.log("🌟 GOD CHARACTER REVEALED!");
  });

  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentChar = CHARACTER_REGISTRY[selectedCharacter];
  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const showcaseSize = isDesktop ? 240 : isTablet ? 180 : 140;
  const gridCharSize = isDesktop ? 120 : isTablet ? 90 : 70;

  // --- Unified Pointer Drag Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    setDragMoved(false);
    startX.current = e.clientX;
    scrollLeftStart.current = scrollRef.current.scrollLeft;

    // UI feedback (will change cursor via CSS)
    scrollRef.current.classList.add("dragging");
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;

    const x = e.clientX;
    const dist = x - startX.current;

    if (Math.abs(dist) > 5 && !dragMoved) {
      setDragMoved(true);
      // Capture pointer ONLY when we move enough to be a drag
      scrollRef.current.setPointerCapture(e.pointerId);
    }

    if (dragMoved) {
      const walk = dist * 1.5;
      scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    isDragging.current = false;

    // Only release if we actually captured it
    try {
      scrollRef.current.releasePointerCapture(e.pointerId);
    } catch (e) {
      // Ignored if not captured
    }

    scrollRef.current.classList.remove("dragging");
  };

  // Prevent selection if we were dragging
  const handleCharClick = (charId: string, isLocked: boolean) => {
    if (dragMoved) return; // Ignore click if drag happened
    if (!isLocked) {
      setSelectedCharacter(charId);
    }
  };

  const scrollAction = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const characters = Object.values(CHARACTER_REGISTRY).filter(char => char.id !== "GOD" || isGodRevealed);

  return (
    <div className="main-hub">
      <header className="hub-header-mini">
        <div className="player-stats-mini">
          <span>💰 0</span>
          <span>Lv.1</span>
          <span>G 0</span>
        </div>
      </header>

      <div className="hub-title-container">
        <h1 className="hub-game-title">BamBam Rush</h1>
        <div className="hub-title-accent"></div>
      </div>

      <div className="hub-left-panel">
        <section className="character-showcase">
          <div className="character-large">
            <CharacterPreview characterId={selectedCharacter} size={showcaseSize} />
          </div>
          <h2 className="character-name">{currentChar.name}</h2>
          <p className="character-desc">{currentChar.description}</p>
          <div className="start-weapon">
            <span className="weapon-label">시작 무기:</span>
            <span className="weapon-name">
              {currentChar.startWeaponIds.map(id => WEAPON_REGISTRY[id]?.name || id).join(", ")}
            </span>
          </div>
        </section>
      </div>

      <div className="hub-right-panel">
        <section className="character-select-section">
          <h3>캐릭터 선택</h3>
          <div className="character-carousel-wrapper">
            <button className="carousel-nav-btn prev" onClick={() => scrollAction("left")}>
              ◀
            </button>

            <div
              className="character-scroll-container"
              ref={scrollRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{ touchAction: "none" }} // Disable browser native pan to allow custom drag
            >
              {characters.map(char => {
                const isLocked = !char.unlocked && char.id !== "GOD";
                const isActive = selectedCharacter === char.id;
                return (
                  <button
                    key={char.id}
                    className={`char-select-btn ${isActive ? "active" : ""} ${isLocked ? "locked" : ""}`}
                    onClick={() => handleCharClick(char.id, isLocked)}
                    disabled={isLocked && char.id !== "GOD"}
                    title={isLocked ? char.unlockCondition : char.name}
                  >
                    <CharacterPreview characterId={char.id} size={gridCharSize} />
                    {isLocked && <div className="lock-overlay">🔒</div>}
                  </button>
                );
              })}
            </div>

            <button className="carousel-nav-btn next" onClick={() => scrollAction("right")}>
              ▶
            </button>
          </div>
        </section>

        <footer className="hub-bottom">
          <button className="library-btn" onClick={() => setShowLibrary(true)}>
            📖 무기 도감
          </button>
          <button className="start-btn-new" onClick={() => onStartGame(selectedCharacter)}>
            BATTLE START
          </button>
        </footer>
      </div>

      {showLibrary && <Library onClose={() => setShowLibrary(false)} />}
    </div>
  );
};
