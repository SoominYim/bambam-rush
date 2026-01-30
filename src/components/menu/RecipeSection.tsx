import React from "react";

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

export const RecipeSection: React.FC<RecipeSectionProps> = ({ title, items }) => (
  <div className="recipe-section">
    <h3>{title}</h3>
    <div className="recipe-list">
      {items.map((item, i) => (
        <div key={i} className="recipe-item">
          <div className="combo">{item.combo || <span style={{ fontSize: "32px" }}>{item.icon}</span>}</div>

          <div className="recipe-info">
            <div className="result">{item.result || item.name}</div>
            <div className="desc">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
