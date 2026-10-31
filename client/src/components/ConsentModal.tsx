import React, { useEffect, useRef } from 'react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmConnect: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirmConnect,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="consent-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-subtitle"
      >
        <div className="consent-header">
          <span className="drive-icon" aria-hidden="true">
            📁
          </span>
          <div>
            <h2 id="consent-title">Connect Your Real Google Drive</h2>
            <p id="consent-subtitle" className="consent-subtitle">
              Gamify your real chore. Review our transparent security & privacy guarantee.
            </p>
          </div>
        </div>

        <div className="consent-grid">
          <div className="consent-pillar pillar-read">
            <div className="pillar-title">
              <span className="pillar-icon" aria-hidden="true">🔍</span>
              <strong>What We Read</strong>
            </div>
            <p className="pillar-text">
              <strong>Metadata ONLY:</strong> file name, file size, MIME type, and last modified date.
              Under no circumstance are file contents opened, downloaded, or shared.
            </p>
          </div>

          <div className="consent-pillar pillar-change">
            <div className="pillar-title">
              <span className="pillar-icon" aria-hidden="true">🗑️</span>
              <strong>What We Change</strong>
            </div>
            <p className="pillar-text">
              Only files you <strong>explicitly shoot</strong> or click are moved to your Drive Trash.
              Every action has a <strong>5-second instant undo</strong> and in-session restore.
            </p>
          </div>

          <div className="consent-pillar pillar-never">
            <div className="pillar-title">
              <span className="pillar-icon" aria-hidden="true">🛡️</span>
              <strong>What We NEVER Do</strong>
            </div>
            <p className="pillar-text">
              <strong>Zero Permanent Deletions:</strong> Permanent delete APIs are completely barred.
              We never access Gmail, Photos, or external drives. No database is kept.
            </p>
          </div>
        </div>

        <div className="consent-notice-box">
          <span className="notice-icon" aria-hidden="true">ℹ️</span>
          <p className="notice-text">
            <strong>Judge / Evaluation Note:</strong> Google OAuth is in <em>Testing mode</em>.
            When signing in, Google may show an &ldquo;Unverified App&rdquo; warning screen. Click
            <strong> Advanced</strong> &rarr; <strong>Go to Storage Invaders (unsafe)</strong> to proceed.
          </p>
        </div>

        <div className="consent-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="consent-cancel-btn"
            onClick={onClose}
            aria-label="Cancel and stay in Demo sandbox mode"
          >
            Stay in Demo Mode
          </button>
          <button
            type="button"
            className="consent-confirm-btn"
            onClick={onConfirmConnect}
            aria-label="Proceed to Google OAuth authorization"
          >
            Connect Google Drive &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
