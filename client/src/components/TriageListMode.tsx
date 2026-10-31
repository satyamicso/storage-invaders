import React, { useState } from 'react';
import type { FileMeta, Analysis } from '@storage-invaders/shared';
import { formatBytes } from '../game/renderer/canvasRenderer';

interface TriageItem {
  file: FileMeta;
  analysis: Analysis;
  status: 'active' | 'pending_trash' | 'trashed' | 'kept';
}

interface TriageListModeProps {
  items: TriageItem[];
  onTrash: (file: FileMeta, analysis: Analysis) => void;
  onKeep: (file: FileMeta) => void;
  onUndo: (id: string) => void;
}

export const TriageListMode: React.FC<TriageListModeProps> = ({
  items,
  onTrash,
  onKeep,
  onUndo,
}) => {
  const [filter, setFilter] = useState<'all' | 'junk' | 'maybe' | 'keep'>('all');

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.analysis.verdict === filter;
  });

  return (
    <section className="list-mode-container" aria-label="Accessible Triage List Mode">
      <div className="list-mode-header">
        <div>
          <h2>File Triage List Mode (Accessible Alternative)</h2>
          <p className="list-mode-subtitle">
            Keyboard-navigable table directly linked to the background trashing engine.
          </p>
        </div>

        <div className="filter-controls" role="toolbar" aria-label="Filter files by verdict">
          <button
            type="button"
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Files ({items.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'junk' ? 'active' : ''}`}
            onClick={() => setFilter('junk')}
          >
            ✕ Junk
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'maybe' ? 'active' : ''}`}
            onClick={() => setFilter('maybe')}
          >
            ? Maybe
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'keep' ? 'active' : ''}`}
            onClick={() => setFilter('keep')}
          >
            🛡 Keep
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="triage-table" aria-label="Drive Candidates Table">
          <thead>
            <tr>
              <th scope="col">File Name</th>
              <th scope="col">Size</th>
              <th scope="col">Verdict</th>
              <th scope="col">Category</th>
              <th scope="col">Why Flagged</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-400">
                  No files match the selected filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isPending = item.status === 'pending_trash';
                const isTrashed = item.status === 'trashed';
                const isKept = item.status === 'kept';
                const verdict = item.analysis.verdict;

                return (
                  <tr
                    key={item.file.id}
                    className={`triage-row ${isPending ? 'row-pending' : ''} ${isTrashed ? 'row-trashed' : ''} ${isKept ? 'row-kept' : ''}`}
                  >
                    <td className="font-medium text-slate-100">
                      <div className="file-name-cell" title={item.file.name}>
                        {item.file.name}
                      </div>
                    </td>
                    <td className="font-mono text-slate-300">
                      {formatBytes(item.file.size)}
                    </td>
                    <td>
                      <span className={`verdict-pill pill-${verdict}`}>
                        {verdict === 'junk'
                          ? '✕ JUNK'
                          : verdict === 'maybe'
                            ? '? MAYBE'
                            : '🛡 KEEP'}
                      </span>
                    </td>
                    <td className="text-slate-400 capitalize">{item.analysis.category}</td>
                    <td className="text-slate-300 text-sm max-w-xs">
                      {item.analysis.reason}
                    </td>
                    <td>
                      <div className="action-button-group">
                        {isPending ? (
                          <button
                            type="button"
                            className="list-undo-btn"
                            onClick={() => onUndo(item.file.id)}
                            aria-label={`Undo trash action for ${item.file.name}`}
                          >
                            ↩ Undo (5s)
                          </button>
                        ) : isTrashed ? (
                          <span className="trashed-tag">In Trash</span>
                        ) : isKept ? (
                          <span className="kept-tag">🛡 Kept Safe</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="list-trash-btn"
                              onClick={() => onTrash(item.file, item.analysis)}
                              aria-label={`Move ${item.file.name} to trash`}
                            >
                              🗑 Trash
                            </button>
                            <button
                              type="button"
                              className="list-keep-btn"
                              onClick={() => onKeep(item.file)}
                              aria-label={`Mark ${item.file.name} as kept`}
                            >
                              🛡 Keep
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
