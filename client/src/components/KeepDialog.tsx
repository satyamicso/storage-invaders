import React, { useEffect, useRef } from 'react';
import type { Asteroid } from '../game/engine/types';
import { formatBytes } from '../game/renderer/canvasRenderer';

interface KeepDialogProps {
  asteroid: Asteroid | null;
  onCancelKeep: () => void;
  onConfirmTrashAnyway: () => void;
}

export const KeepDialog: React.FC<KeepDialogProps> = ({
  asteroid,
  onCancelKeep,
  onConfirmTrashAnyway,
}) => {
  const keepSafeBtnRef = useRef<HTMLButtonElement>(null);
  const trashAnywayBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Trap focus onto the safe cancel button by default
    if (asteroid && keepSafeBtnRef.current) {
      keepSafeBtnRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!asteroid) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelKeep();
      } else if (e.key === 'Tab') {
        // Tab trap between keep safe and trash anyway buttons
        if (e.shiftKey) {
          if (document.activeElement === keepSafeBtnRef.current) {
            e.preventDefault();
            trashAnywayBtnRef.current?.focus();
          }
        } else {
          if (document.activeElement === trashAnywayBtnRef.current) {
            e.preventDefault();
            keepSafeBtnRef.current?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asteroid, onCancelKeep]);

  if (!asteroid) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancelKeep();
      }}
    >
      <div
        className="keep-dialog-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="keep-dialog-title"
        aria-describedby="keep-dialog-desc"
      >
        <div className="dialog-header">
          <span className="shield-icon" aria-hidden="true">
            🛡️
          </span>
          <h2 id="keep-dialog-title">Hold Your Fire! Guarded File</h2>
        </div>

        <div className="dialog-body">
          <p id="keep-dialog-desc" className="dialog-desc">
            You hit a file flagged as <strong>KEEP</strong>. Are you sure you want to trash it?
          </p>

          <div className="file-preview-card">
            <div className="file-preview-title">{asteroid.file.name}</div>
            <div className="file-preview-meta">
              Size: {formatBytes(asteroid.file.size)} • Type: {asteroid.file.mimeType}
            </div>
            <div className="gemini-reason-box">
              <span className="reason-label">AI Rationale:</span>
              <p className="reason-text">"{asteroid.analysis.reason}"</p>
            </div>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            ref={keepSafeBtnRef}
            type="button"
            className="keep-safe-btn"
            onClick={onCancelKeep}
            aria-label="Keep Safe: Retain file and resume game"
          >
            🛡️ Keep Safe (Recommended)
          </button>
          <button
            ref={trashAnywayBtnRef}
            type="button"
            className="trash-anyway-btn"
            onClick={onConfirmTrashAnyway}
            aria-label="Trash Anyway: Move guarded file to trash"
          >
            🗑️ Trash Anyway
          </button>
        </div>
      </div>
    </div>
  );
};
