import React from 'react';
import type { EngineStats } from '../game/engine/types';
import { StorageBar } from './StorageBar';
import { formatBytes } from '../game/renderer/canvasRenderer';

interface EndScreenProps {
  stats: EngineStats;
  initialStorageBytes: number;
  onPlayAgain: () => void;
  onRestoreAll: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  stats,
  initialStorageBytes,
  onPlayAgain,
  onRestoreAll,
}) => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="end-title">
      <div className="end-screen-card">
        <div className="end-header">
          <span className="trophy-icon" aria-hidden="true">
            🎉
          </span>
          <h2 id="end-title">Mission Debrief: Wave Complete!</h2>
          <p className="end-subtitle">
            Arcade chore execution confirmed. Real Drive storage has been freed.
          </p>
        </div>

        <div className="end-metrics-grid">
          <div className="end-metric-card highlight">
            <span className="end-metric-label">TOTAL STORAGE FREED</span>
            <span className="end-metric-val font-mono">
              {formatBytes(stats.confirmedFreedBytes)}
            </span>
          </div>
          <div className="end-metric-card">
            <span className="end-metric-label">FILES TRASHED</span>
            <span className="end-metric-val">{stats.trashedCount}</span>
          </div>
          <div className="end-metric-card">
            <span className="end-metric-label">FILES KEPT SAFE</span>
            <span className="end-metric-val">{stats.keptCount}</span>
          </div>
          <div className="end-metric-card">
            <span className="end-metric-label">MAX COMBO</span>
            <span className="end-metric-val">{stats.maxCombo}×</span>
          </div>
        </div>

        <div className="end-storage-section">
          <StorageBar
            initialUsedBytes={initialStorageBytes}
            freedBytes={stats.confirmedFreedBytes}
          />
        </div>

        <div className="end-actions">
          <button
            type="button"
            className="play-again-btn"
            onClick={onPlayAgain}
            autoFocus
            aria-label="Play next wave"
          >
            🚀 Play Next Wave
          </button>
          {stats.trashedCount > 0 && (
            <button
              type="button"
              className="restore-all-end-btn"
              onClick={onRestoreAll}
              aria-label="Restore all trashed files back to active Drive"
            >
              ↺ Restore All Trashed Files
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
