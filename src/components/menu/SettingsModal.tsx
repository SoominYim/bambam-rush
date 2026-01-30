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
          <h2>⚙️ 설정</h2>
          <button className="close-btn" onClick={onBack}>
            ✕
          </button>
        </div>

        <div className="settings-body">
          <div className="setting-group">
            <h3>사운드</h3>
            <div className="setting-item">
              <span className="label">효과음 (SFX)</span>
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
              <span className="label">배경음 (BGM)</span>
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
            <h3>인터페이스</h3>
            <div className="setting-item">
              <span className="label">조이스틱 표시</span>
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
