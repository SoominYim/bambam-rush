import { useState, useEffect, memo } from "react";
import { getGold } from "@/game/managers/state";
import "@/styles/hud.css";

export const GoldDisplay = memo(() => {
  const [gold, setGold] = useState(getGold());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentGold = getGold();
      setGold(prev => (prev !== currentGold ? currentGold : prev));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gold-container">
      <span className="gold-icon">💰</span>
      <span className="gold-value">{gold.toLocaleString()}</span>
    </div>
  );
});

GoldDisplay.displayName = "GoldDisplay";
