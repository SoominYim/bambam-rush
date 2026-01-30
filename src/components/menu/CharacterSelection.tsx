import { memo } from "react";
import { ElementType } from "@/game/types";
import "@/styles/characterSelect.css";

interface CharacterSelectionProps {
  onSelect: (element: ElementType) => void;
}

const CHARACTERS = [
  { type: ElementType.FIRE, name: "불(Inferno)", icon: "🔥", desc: "적을 지속적으로 불태웁니다" },
  { type: ElementType.WATER, name: "물(Tidal)", icon: "💧", desc: "적을 밀쳐냅니다" },
  { type: ElementType.ICE, name: "얼음(Glacier)", icon: "❄️", desc: "적을 느리게 만듭니다" },
  { type: ElementType.WIND, name: "바람(Tempest)", icon: "💨", desc: "적을 관통합니다" },
  { type: ElementType.POISON, name: "독(Venom)", icon: "☠️", desc: "넓은 범위에 지속 피해를 줍니다" },
  { type: ElementType.ELECTRIC, name: "전기(Spark)", icon: "⚡", desc: "연쇄적으로 피해를 줍니다" },
  { type: ElementType.SWORD, name: "검(Blade)", icon: "🗡️", desc: "강력한 단일 피해를 줍니다" },
  { type: ElementType.BOOK, name: "마법(Arcane)", icon: "📖", desc: "유도 발사체를 발사합니다" },
];

export const CharacterSelection = memo(({ onSelect }: CharacterSelectionProps) => {
  return (
    <div className="char-select-overlay">
      <div className="char-select-container">
        <h1 className="game-title">BamBam Rush</h1>
        <p className="game-subtitle">시작할 원소를 선택하세요</p>

        <div className="char-grid">
          {CHARACTERS.map(char => (
            <div key={char.type} className={`char-card ${char.type.toLowerCase()}`} onClick={() => onSelect(char.type)}>
              <div className="char-icon">{char.icon}</div>
              <h3 className="char-name">{char.name}</h3>
              <p className="char-desc">{char.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
