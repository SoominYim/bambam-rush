import React, { useState } from "react";
import { CHARACTER_REGISTRY } from "@/game/config/characterRegistry";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import { CharacterPreview } from "./CharacterPreview";
import { Library } from "./Library";
import "@/styles/mainHub.css";

interface MainHubProps {
  onStartGame: (characterId: string) => void;
}

export const MainHub: React.FC<MainHubProps> = ({ onStartGame }) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("BASIC");

  const currentChar = CHARACTER_REGISTRY[selectedCharacter];
  const currentWeapon = WEAPON_REGISTRY[currentChar.startWeaponId];

  return (
    <div className="main-hub">
      {/* 상단 미니 헤더 */}
      <header className="hub-header-mini">
        <span className="season-badge-mini">ALPHA</span>
        <div className="player-stats-mini">
          <span>Lv.1</span>
          <span>G 0</span>
        </div>
      </header>

      {/* 왼쪽 패널 (데스크톱에서만 분리됨) */}
      <div className="hub-left-panel">
        <section className="character-showcase">
          <div className="character-large">
            <CharacterPreview characterId={selectedCharacter} size={160} />
          </div>
          <h2 className="character-name">{currentChar.name}</h2>
          <p className="character-desc">{currentChar.description}</p>
          <div className="start-weapon">
            <span className="weapon-label">시작 무기:</span>
            <span className="weapon-name">{currentWeapon?.name || currentChar.startWeaponId}</span>
          </div>
        </section>
      </div>

      {/* 오른쪽 패널 (데스크톱에서만 분리됨) */}
      <div className="hub-right-panel">
        {/* 캐릭터 선택 그리드 */}
        <section className="character-select-section">
          <h3>캐릭터 선택</h3>
          <div className="character-select-grid">
            {Object.values(CHARACTER_REGISTRY).map(char => {
              const isLocked = !char.unlocked;
              const isActive = selectedCharacter === char.id;
              return (
                <button
                  key={char.id}
                  className={`char-select-btn ${isActive ? "active" : ""} ${isLocked ? "locked" : ""}`}
                  onClick={() => !isLocked && setSelectedCharacter(char.id)}
                  disabled={isLocked}
                  title={isLocked ? char.unlockCondition : char.name}
                >
                  <CharacterPreview characterId={char.id} size={48} isSelected={isActive} />
                  {isLocked && <div className="lock-overlay">🔒</div>}
                </button>
              );
            })}
          </div>
        </section>

        {/* 하단 버튼들 */}
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
