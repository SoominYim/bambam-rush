import { memo } from "react";
import { Card } from "@/game/systems/cardSystem";
import { selectLevelUpCard } from "@/game/managers/state";
import "@/styles/levelUp.css";

interface LevelUpModalProps {
  choices: Card[];
}

export const LevelUpModal = memo(({ choices }: LevelUpModalProps) => {
  const handleSelect = (index: number) => {
    selectLevelUpCard(index);
  };

  return (
    <div className="level-up-modal-overlay">
      <div className="level-up-container">
        <h2 className="level-up-title">레벨 업!</h2>
        <p className="level-up-subtitle">보상을 선택하세요</p>

        <div className="cards-container">
          {choices.map((card, index) => (
            <div key={card.id} className={`card-item ${card.rarity.toLowerCase()}`} onClick={() => handleSelect(index)}>
              <div className="card-rarity">{card.rarity}</div>
              <div className="card-icon">{card.icon}</div>
              <div className="card-content">
                <h3 className="card-title">{card.title}</h3>
                <p className="card-desc">{card.description}</p>
                {card.type === "SKILL" && (
                  <div className="card-recipe">
                    <span className="recipe-label">속성:</span> {card.elementType}
                  </div>
                )}
              </div>
              <button className="select-btn">선택</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
