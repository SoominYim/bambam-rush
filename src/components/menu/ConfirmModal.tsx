import { memo } from "react";
import "@/styles/menu.css";

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = memo(({ title, message, onConfirm, onCancel }: ConfirmModalProps) => {
  return (
    <div className="recipe-modal" style={{ zIndex: 3000 }}>
      <div className="modal-content confirm-modal-content" style={{ maxWidth: "350px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", marginBottom: "15px" }}>{title}</h2>
        <p style={{ color: "#aaa", marginBottom: "30px", fontSize: "16px", lineHeight: "1.5" }}>{message}</p>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="menu-btn" onClick={onCancel} style={{ flex: 1, background: "rgba(255,255,255,0.1)" }}>
            취소
          </button>
          <button className="menu-btn danger" onClick={onConfirm} style={{ flex: 1 }}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
});
