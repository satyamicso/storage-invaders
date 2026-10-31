import React from 'react';
import type { Asteroid } from '../game/engine/types';
import { formatBytes } from '../game/renderer/canvasRenderer';

interface TooltipProps {
  asteroid: Asteroid | null;
  canvasRect: DOMRect | null;
}

export const Tooltip: React.FC<TooltipProps> = ({ asteroid, canvasRect }) => {
  if (!asteroid || !canvasRect) return null;

  // Position tooltip safely near mouse / asteroid
  const scaleX = canvasRect.width / 800;
  const scaleY = canvasRect.height / 600;

  const left = canvasRect.left + asteroid.x * scaleX;
  const top = canvasRect.top + asteroid.y * scaleY - asteroid.radius * scaleY - 10;

  const { verdict, confidence, reason, category, source } = asteroid.analysis;

  return (
    <div
      className="asteroid-tooltip"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
        zIndex: 50,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="tooltip-header">
        <span className={`verdict-pill pill-${verdict}`}>
          {verdict === 'junk' ? '✕ JUNK' : verdict === 'maybe' ? '? MAYBE' : '🛡 KEEP'}
        </span>
        <span className="source-badge">
          {source === 'gemini' ? '✦ Gemini 2.5' : '⚙ Heuristic'}
        </span>
      </div>

      <div className="tooltip-name">{asteroid.file.name}</div>

      <div className="tooltip-meta">
        <span>{formatBytes(asteroid.file.size)}</span>
        <span>•</span>
        <span className="tooltip-category">{category}</span>
        <span>•</span>
        <span>{Math.round(confidence * 100)}% match</span>
      </div>

      <div className="tooltip-reason">
        <strong>Why flagged:</strong> {reason}
      </div>
    </div>
  );
};
