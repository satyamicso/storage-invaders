import React from 'react';
import { formatBytes } from '../game/renderer/canvasRenderer';

interface StorageBarProps {
  initialUsedBytes: number;
  freedBytes: number;
  totalCapacityBytes?: number;
}

export const StorageBar: React.FC<StorageBarProps> = ({
  initialUsedBytes,
  freedBytes,
  totalCapacityBytes = 15 * 1024 * 1024 * 1024, // 15 GB standard Google Drive tier
}) => {
  const currentUsedBytes = Math.max(0, initialUsedBytes - freedBytes);
  const initialUsedPercent = Math.min(100, (initialUsedBytes / totalCapacityBytes) * 100);
  const currentUsedPercent = Math.min(100, (currentUsedBytes / totalCapacityBytes) * 100);
  const freedPercent = Math.max(0, initialUsedPercent - currentUsedPercent);

  return (
    <div className="storage-bar-card" role="region" aria-label="Drive Storage Visualization">
      <div className="storage-bar-header">
        <span className="storage-title">Google Drive Storage Cleaned</span>
        <span className="storage-metric">
          {formatBytes(currentUsedBytes)} / {formatBytes(totalCapacityBytes)} used
        </span>
      </div>

      <div
        className="storage-track"
        role="progressbar"
        aria-valuenow={Math.round(currentUsedPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Storage capacity bar"
      >
        {/* Remaining used space */}
        <div
          className="storage-segment used"
          style={{ width: `${currentUsedPercent}%` }}
          title={`Remaining Used: ${formatBytes(currentUsedBytes)}`}
        />
        {/* Freed space (pulsing green highlight) */}
        {freedBytes > 0 && (
          <div
            className="storage-segment freed"
            style={{ width: `${freedPercent}%` }}
            title={`Freed by Storage Invaders: ${formatBytes(freedBytes)}`}
          />
        )}
      </div>

      <div className="storage-bar-legend">
        <div className="legend-item">
          <span className="legend-dot dot-used" aria-hidden="true" />
          <span>Retained: {formatBytes(currentUsedBytes)}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-freed" aria-hidden="true" />
          <span className="text-freed font-bold">
            Freed: +{formatBytes(freedBytes)}
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-available" aria-hidden="true" />
          <span>Free Quota: {formatBytes(totalCapacityBytes - currentUsedBytes)}</span>
        </div>
      </div>
    </div>
  );
};
