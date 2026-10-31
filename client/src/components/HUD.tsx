import React from 'react';
import type { EngineStats } from '../game/engine/types';
import { formatBytes } from '../game/renderer/canvasRenderer';

interface HUDProps {
  stats: EngineStats;
  mode: 'demo' | 'drive';
  userEmail?: string;
  aiSource: 'gemini' | 'heuristic';
  speedMultiplier: number;
  isMuted: boolean;
  isPaused: boolean;
  isListMode: boolean;
  onChangeSpeed: (speed: number) => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleListMode: () => void;
  onOpenConnect: () => void;
  onDisconnect: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  mode,
  userEmail,
  aiSource,
  speedMultiplier,
  isMuted,
  isPaused,
  isListMode,
  onChangeSpeed,
  onToggleMute,
  onTogglePause,
  onToggleListMode,
  onOpenConnect,
  onDisconnect,
}) => {
  return (
    <header className="hud-container" role="banner" aria-label="Game HUD">
      <div className="hud-left">
        <div className="mode-badge" title={mode === 'demo' ? 'Running in zero-login demo sandbox' : `Connected as ${userEmail}`}>
          <span className="dot" aria-hidden="true" />
          <span>{mode === 'demo' ? 'DEMO SANDBOX' : `DRIVE: ${userEmail || 'Connected'}`}</span>
        </div>

        {mode === 'demo' ? (
          <button
            type="button"
            className="connect-drive-hud-btn"
            onClick={onOpenConnect}
            aria-label="Connect your real Google Drive account"
          >
            📁 Connect Drive
          </button>
        ) : (
          <button
            type="button"
            className="disconnect-hud-btn"
            onClick={onDisconnect}
            aria-label="Disconnect Google Drive and return to Demo mode"
          >
            ✕ Demo Mode
          </button>
        )}

        <div
          className={`ai-source-badge ${aiSource === 'gemini' ? 'gemini-active' : 'heuristic-active'}`}
          title={aiSource === 'gemini' ? 'Triage powered by live Gemini 2.5 Flash' : 'Triage powered by rule-based heuristic fallback'}
        >
          {aiSource === 'gemini' ? '✦ Gemini 2.5' : '⚙ Heuristic'}
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
        {/* Game speed selector for accessibility & cognitive comfort */}
        <div className="speed-selector" role="group" aria-label="Game Speed">
          <label htmlFor="speed-select" className="sr-only">Game Speed</label>
          <select
            id="speed-select"
            className="hud-select"
            value={speedMultiplier}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            aria-label="Select Game Speed"
            title="Adjust simulation speed"
          >
            <option value="0.5">0.5× Speed</option>
            <option value="0.75">0.75× Speed</option>
            <option value="1">1.0× Speed</option>
            <option value="1.25">1.25× Speed</option>
          </select>
        </div>

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
