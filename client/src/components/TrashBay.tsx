import React, { useState, useEffect } from 'react';
import type { QueuedAction } from '../queue/actionQueue';
import { formatBytes } from '../game/renderer/canvasRenderer';

interface TrashBayProps {
  pendingActions: QueuedAction[];
  confirmedActions: QueuedAction[];
  onUndo: (id: string) => void;
  onRestore: (id: string) => void;
  onRestoreAll: () => void;
}

export const TrashBay: React.FC<TrashBayProps> = ({
  pendingActions,
  confirmedActions,
  onUndo,
  onRestore,
  onRestoreAll,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update timer every 100ms for smooth progress bar on undo toasts
  useEffect(() => {
    if (pendingActions.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [pendingActions.length]);

  const totalConfirmedBytes = confirmedActions.reduce(
    (acc, a) => acc + a.file.size,
    0
  );

  return (
    <aside className="trash-bay-dock" aria-label="Trash Bay and Undo Tray">
      {/* 1. Floating Undo Toasts */}
      <div className="undo-toast-container" role="region" aria-label="Undo Notifications">
        {pendingActions.map((action) => {
          const totalDuration = 5000;
          const remainingMs = Math.max(0, action.undoExpiresAt - now);
          const percent = Math.min(100, (remainingMs / totalDuration) * 100);
          const seconds = (remainingMs / 1000).toFixed(1);

          return (
            <div
              key={action.id}
              className="undo-toast"
              role="alert"
              aria-live="assertive"
            >
              <div className="undo-toast-content">
                <span className="undo-toast-icon">🗑️</span>
                <div className="undo-toast-details">
                  <span className="undo-toast-name">{action.file.name}</span>
                  <span className="undo-toast-meta">
                    {formatBytes(action.file.size)} • Trashing in {seconds}s
                  </span>
                </div>
                <button
                  type="button"
                  className="undo-toast-btn"
                  onClick={() => onUndo(action.id)}
                  aria-label={`Undo trashing ${action.file.name}`}
                >
                  ↩ Undo
                </button>
              </div>
              <div
                className="undo-progress-bar"
                style={{ width: `${percent}%` }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>

      {/* 2. Dockable Trash Bay Drawer */}
      <div className="trash-bay-bar">
        <button
          type="button"
          className="trash-bay-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="trash-bay-tray"
        >
          <span className="trash-icon">🗄️</span>
          <span>
            Trash Bay ({confirmedActions.length} files • {formatBytes(totalConfirmedBytes)})
          </span>
          <span className="chevron">{isExpanded ? '▼' : '▲'}</span>
        </button>

        {confirmedActions.length > 0 && (
          <button
            type="button"
            className="restore-all-btn"
            onClick={onRestoreAll}
            aria-label={`Restore all ${confirmedActions.length} files`}
          >
            ↺ Restore All
          </button>
        )}
      </div>

      {isExpanded && (
        <div id="trash-bay-tray" className="trash-bay-tray" role="region">
          {confirmedActions.length === 0 ? (
            <p className="empty-tray-text">No files currently in Trash Bay.</p>
          ) : (
            <ul className="trash-bay-list" role="list">
              {confirmedActions.map((action) => (
                <li key={action.id} className="trash-bay-item">
                  <div className="trash-item-info">
                    <span className="trash-item-name">{action.file.name}</span>
                    <span className="trash-item-size">
                      {formatBytes(action.file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="restore-btn"
                    onClick={() => onRestore(action.id)}
                    aria-label={`Restore ${action.file.name}`}
                  >
                    ↺ Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
};
