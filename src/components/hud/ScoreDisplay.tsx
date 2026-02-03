import { useState, useEffect, memo } from "react";
import { getScore } from "@/game/managers/state";
import "@/styles/hud.css";

export const ScoreDisplay = memo(() => {
  const [score, setScore] = useState(getScore());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentScore = getScore();
      setScore(prev => (prev !== currentScore ? currentScore : prev));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="score-container">
      <span className="score-label">Score</span>
      <span className="score-value">{score.toLocaleString()}</span>
    </div>
  );
});
ScoreDisplay.displayName = "ScoreDisplay";
