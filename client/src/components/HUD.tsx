import React from 'react';
import type { EngineStats } from '../game/engine/types';
import { formatBytes } from '../game/renderer/canvasRenderer';

interface HUDProps {
  stats: EngineStats;
  mode: 'demo' | 'drive';
  isMuted: boolean;
  isPaused: boolean;
  isListMode: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleListMode: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  mode,
  isMuted,
  isPaused,
  isListMode,
  onToggleMute,
  onTogglePause,
  onToggleListMode,
}) => {
  return (
    <header className="hud-container" role="banner" aria-label="Game HUD">
      <div className="hud-left">
        <div className="mode-badge" title="Running in zero-login demo sandbox">
          <span className="dot" aria-hidden="true" />
          <span>{mode === 'demo' ? 'DEMO SANDBOX' : 'GOOGLE DRIVE'}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">WAVE</span>
          <span className="metric-value">{stats.wave}</span>
        </div>
      </div>

      <div className="hud-center">
        <div className="metric-box freed-highlight" aria-live="polite">
          <span className="metric-label">STORAGE FREED</span>
          <span className="metric-value font-mono">
            {formatBytes(stats.confirmedFreedBytes)}
          </span>
          {stats.pendingFreedBytes > 0 && (
            <span className="pending-indicator">
              (+{formatBytes(stats.pendingFreedBytes)} pending)
            </span>
          )}
        </div>
        <div className="metric-box">
          <span className="metric-label">COMBO</span>
          <span className={`metric-value combo-value ${stats.combo > 1 ? 'combo-active' : ''}`}>
            {stats.combo}×
          </span>
        </div>
        <div className="metric-box">
          <span className="metric-label">SCORE</span>
          <span className="metric-value font-mono">{stats.score.toLocaleString()}</span>
        </div>
      </div>

      <div className="hud-right">
        <button
          type="button"
          className="hud-button"
          onClick={onToggleListMode}
          aria-label={isListMode ? 'Switch to Arcade Shooter Mode' : 'Switch to Accessible Triage List Mode'}
          title="Switch view (List vs Arcade)"
        >
          {isListMode ? '🚀 Arcade' : '📋 List Mode'}
        </button>
        <button
          type="button"
          className="hud-button"
          onClick={onTogglePause}
          aria-label={isPaused ? 'Resume game' : 'Pause game (Esc)'}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          type="button"
          className="hud-button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
        >
          {isMuted ? '🔇 Muted' : '🔊 Sound'}
        </button>
      </div>
    </header>
  );
};
