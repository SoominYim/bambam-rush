import { memo, useState } from "react";
import "@/styles/menu.css";

interface SettingsModalProps {
  onBack: () => void;
}

export const SettingsModal = memo(({ onBack }: SettingsModalProps) => {
  const [bgmVolume, setBgmVolume] = useState(50);
  const [sfxVolume, setSfxVolume] = useState(80);
  const [showJoystick, setShowJoystick] = useState(true);

  return (
    <div className="recipe-modal">
      {" "}
      {/* 공통 모달 스타일 재사용 */}
      <div className="modal-content settings-content">
        <div className="modal-header">
          <h2>⚙️ SETTINGS</h2>
          <button className="close-btn" onClick={onBack}>
            ✕
          </button>
        </div>

        <div className="settings-body">
          <div className="setting-group">
            <h3>SOUND</h3>
            <div className="setting-item">
              <span className="label">Sound Effects</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVolume}
                onChange={e => setSfxVolume(Number(e.target.value))}
                className="slider"
              />
              <span className="value">{sfxVolume}%</span>
            </div>
            <div className="setting-item">
              <span className="label">Background Music</span>
              <input
                type="range"
                min="0"
                max="100"
                value={bgmVolume}
                onChange={e => setBgmVolume(Number(e.target.value))}
                className="slider"
              />
              <span className="value">{bgmVolume}%</span>
            </div>
          </div>

          <div className="setting-group">
            <h3>INTERFACE</h3>
            <div className="setting-item">
              <span className="label">Show Joystick</span>
              <button
                className={`toggle-btn ${showJoystick ? "active" : ""}`}
                onClick={() => setShowJoystick(!showJoystick)}
              >
                {showJoystick ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
