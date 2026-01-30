import "./GameUI.css";

interface GameUIProps {
  score: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ score, isPaused, onPause, onResume }) => {
  const handlePauseClick = () => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  return (
    <>
      {/* 상단 HUD */}
      <div className="game-hud">
        <div className="score">점수: {score}</div>
        <button className="pause-btn" onClick={handlePauseClick}>
          {isPaused ? "▶" : "⏸"}
        </button>
      </div>

      {/* 조합법 모달 */}
      {isPaused && (
        <div className="recipe-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🎮 조합법</h2>
              <button className="close-btn" onClick={handlePauseClick}>
                ✕
              </button>
            </div>

            <div className="recipe-grid">
              <RecipeSection
                title="⚔️ 기본 공격"
                items={[
                  { icon: "🔥", name: "화염구", desc: "3초마다 전방 발사" },
                  { icon: "❄️", name: "얼음 파편", desc: "2초마다 3방향" },
                  { icon: "☠️", name: "독 가시", desc: "근거리 DoT" },
                  { icon: "⚡", name: "전기 구체", desc: "오비탈" },
                ]}
              />

              <RecipeSection
                title="💪 패시브"
                items={[
                  { icon: "❤️", name: "하트", desc: "체력 +20" },
                  { icon: "🪽", name: "날개", desc: "속도 +5%" },
                  { icon: "🧲", name: "자석", desc: "범위 +10%" },
                ]}
              />

              <RecipeSection
                title="🔥 3개 조합"
                items={[
                  { combo: "🔥🔥🔥", result: "화염폭풍" },
                  { combo: "❄️❄️❄️", result: "블리자드" },
                  { combo: "☠️☠️☠️", result: "맹독 분수" },
                ]}
              />

              <RecipeSection
                title="✨ 시너지"
                items={[
                  { combo: "🔥❄️", result: "증기 폭발" },
                  { combo: "☠️⚡", result: "마비 독" },
                  { combo: "🔥☠️", result: "용암" },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface RecipeSectionProps {
  title: string;
  items: Array<{
    icon?: string;
    name?: string;
    desc?: string;
    combo?: string;
    result?: string;
  }>;
}

const RecipeSection: React.FC<RecipeSectionProps> = ({ title, items }) => (
  <div className="recipe-section">
    <h3>{title}</h3>
    <div className="recipe-list">
      {items.map((item, i) => (
        <div key={i} className="recipe-item">
          {item.combo ? (
            <>
              <span className="combo">{item.combo}</span>
              <span className="arrow">→</span>
              <span className="result">{item.result}</span>
            </>
          ) : (
            <>
              <span className="icon">{item.icon}</span>
              <div className="info">
                <div className="name">{item.name}</div>
                <div className="desc">{item.desc}</div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  </div>
);
