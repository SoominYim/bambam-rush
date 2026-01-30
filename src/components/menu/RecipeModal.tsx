import { memo } from "react";
import "@/styles/menu.css";
import { RecipeSection } from "./RecipeSection";
import { RECIPE_LIST, ELEMENT_DETAILS } from "@/game/config/recipeData";
import { ElementType } from "@/game/types";

interface RecipeModalProps {
  onClose: () => void;
}

export const RecipeModal = memo(({ onClose }: RecipeModalProps) => {
  return (
    <div className="recipe-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>🎮 조합법 (Recipe)</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="recipe-grid">
          <RecipeSection
            title="📚 기본 원소 (Basic Elements)"
            items={[
              ElementType.FIRE,
              ElementType.WATER,
              ElementType.ICE,
              ElementType.WIND,
              ElementType.POISON,
              ElementType.ELECTRIC,
              ElementType.SWORD,
              ElementType.BOOK,
            ].map(type => {
              const info = ELEMENT_DETAILS[type];
              return {
                combo: info.icon, // 아이콘을 콤보 자리에 표시
                result: info.name,
                desc: info.desc,
              };
            })}
          />

          <RecipeSection
            title="⭐ 진화 (Evolutions)"
            items={RECIPE_LIST.filter(r => r.type === "evolution").map(recipe => {
              const inputIcon = ELEMENT_DETAILS[recipe.inputs[0]].icon;
              return {
                combo: `${inputIcon} x 3`,
                result: recipe.output,
                desc: recipe.desc,
              };
            })}
          />

          <RecipeSection
            title="✨ 시너지 (Synergies)"
            items={RECIPE_LIST.filter(r => r.type === "synergy").map(recipe => {
              const icon1 = ELEMENT_DETAILS[recipe.inputs[0]].icon;
              const icon2 = ELEMENT_DETAILS[recipe.inputs[1]].icon;
              return {
                combo: `${icon1} + ${icon2}`,
                result: recipe.output,
                desc: recipe.desc,
              };
            })}
          />
        </div>
      </div>
    </div>
  );
});
