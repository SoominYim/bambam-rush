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

  // States for Drag-to-Scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
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

  // --- Drag Scroll Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;

    if (Math.abs(walk) > 5) {
      setDragMoved(true);
    }

    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      const scrollAmount = 200;
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
              className={`character-scroll-container ${isDragging ? "dragging" : ""}`}
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
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
                    style={{ pointerEvents: isDragging ? "none" : "auto" }}
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
