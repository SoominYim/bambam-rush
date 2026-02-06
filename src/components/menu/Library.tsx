import React, { useState } from "react";
import { WEAPON_REGISTRY } from "@/game/config/weaponRegistry";
import { PASSIVE_REGISTRY } from "@/game/config/passiveRegistry";
import "@/styles/library.css";
import { WeaponIcon } from "@/components/common/WeaponIcon";

interface LibraryProps {
  onClose: () => void;
}

export const Library: React.FC<LibraryProps> = ({ onClose }) => {
  const [tab, setTab] = useState<"weapon" | "passive" | "bestiary">("weapon");
  const weapons = Object.values(WEAPON_REGISTRY);
  const passives = Object.values(PASSIVE_REGISTRY);

  return (
    <div className="library-overlay">
      <div className="library-container">
        <header className="library-header">
          <h2>📜 도감 (Library)</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <nav className="library-tabs">
          <button className={tab === "weapon" ? "active" : ""} onClick={() => setTab("weapon")}>
            무기 (Weapons)
          </button>
          <button className={tab === "passive" ? "active" : ""} onClick={() => setTab("passive")}>
            패시브 (Passives)
          </button>
          <button className={tab === "bestiary" ? "active" : ""} onClick={() => setTab("bestiary")}>
            몬스터 (Bestiary)
          </button>
        </nav>

        <div className="library-content custom-scrollbar">
          {tab === "weapon" && (
            <div className="item-grid">
              {weapons.map(w => (
                <div key={w.id} className="library-item">
                  <div className="item-icon-wrapper">
                    <span className="item-icon">
                      <WeaponIcon weapon={w} />
                    </span>
                  </div>
                  <div className="item-info">
                    <h3 className="item-name">{w.name}</h3>
                    <p className="item-desc">{w.description}</p>
                    <div className="item-tags">
                      {w.tags.map(t => (
                        <span key={t} className={`tag tag-${t.toLowerCase()}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "passive" && (
            <div className="item-grid">
              {passives.map(p => (
                <div key={p.id} className="library-item">
                  <div className="item-icon-wrapper passive">
                    <span className="item-icon">{getPassiveIcon(p.id)}</span>
                  </div>
                  <div className="item-info">
                    <h3 className="item-name">{p.name}</h3>
                    <p className="item-desc">{p.description}</p>
                    <div className="passive-lv1">Lv.1: {p.levels[1].description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "bestiary" && <div className="empty-state">준비 중입니다...</div>}
        </div>
      </div>
    </div>
  );
};

const getPassiveIcon = (id: string): string => {
  switch (id) {
    case "P01":
      return "💪";
    case "P02":
      return "⏳";
    case "P05":
      return "⚡";
    case "P06":
      return "📖";
    case "P13":
      return "👯";
    default:
      return "💎";
  }
};
