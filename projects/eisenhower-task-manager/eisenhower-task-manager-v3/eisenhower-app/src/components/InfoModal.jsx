import React from 'react';
import { X } from 'lucide-react';

/**
 * InfoModal — light "About" card for the Info glyph on the chrome row.
 * Shows app name, version, a one-line frame, a Ctrl+K / ? hint, and a
 * backup-status line if available. Click "Keyboard Shortcuts" to hand
 * off to the ShortcutHelp overlay without closing this one redundantly.
 *
 * Props:
 *   version          — string, e.g. "v3.0"
 *   backupMetadata   — { lastExport, exportCount, lastAutoSave } | null
 *   onShowShortcuts  — () => void
 *   onClose          — () => void
 */
export const InfoModal = ({ version = 'v3.0', backupMetadata, onShowShortcuts, onClose }) => {
  const lastExport = backupMetadata?.lastExport
    ? new Date(backupMetadata.lastExport).toLocaleString()
    : 'never';
  const lastAutoSave = backupMetadata?.lastAutoSave
    ? new Date(backupMetadata.lastAutoSave).toLocaleString()
    : '—';

  return (
    <div className="cin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cin-modal" style={{ maxWidth: '28rem' }}>
        <div className="cin-modal__head">
          <div className="cin-modal__title">About</div>
          <button className="cin-modal__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cin-modal__body">
          <div className="cin-info-block">
            <div className="cin-info-block__name">Eisenhower Task Manager</div>
            <div className="cin-info-block__version">{version} · Peirastes Cinematic Tier</div>
            <div className="cin-info-block__line">
              Operations console for the Eisenhower Matrix. Sorts work into
              critical / strategic / delegate / eliminate.
            </div>
          </div>

          <div className="cin-settings-section">
            <div className="cin-settings-section__head">Shortcuts</div>
            <div className="cin-settings-section__hint">
              Press <kbd className="cin-info-kbd">?</kbd> any time for the full list, or open it now.
            </div>
            <button
              type="button"
              className="cin-btn cin-btn--secondary"
              style={{ marginTop: 10 }}
              onClick={() => { onClose(); onShowShortcuts(); }}
            >Keyboard Shortcuts</button>
          </div>

          <div className="cin-settings-section">
            <div className="cin-settings-section__head">Backup</div>
            <div className="cin-info-grid">
              <div className="cin-info-grid__label">Last export</div>
              <div className="cin-info-grid__value">{lastExport}</div>
              <div className="cin-info-grid__label">Export count</div>
              <div className="cin-info-grid__value">{backupMetadata?.exportCount ?? 0}</div>
              <div className="cin-info-grid__label">Last auto-save</div>
              <div className="cin-info-grid__value">{lastAutoSave}</div>
            </div>
          </div>

          <div className="cin-info-foot">
            <a href="https://peirastes.com/" className="cin-info-foot__link">peirastes.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};
