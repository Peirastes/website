import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

/**
 * SettingsModal — cog-button modal for editing taxonomy + display prefs.
 *
 * Works on a local draft so Cancel discards changes; Save dispatches a
 * merged update to setSettings (which the App-level auto-save effect
 * persists to the server).
 *
 * Sections:
 *   • List density toggle (Simple / Advanced — mirrors the List toolbar)
 *   • Domains (chip add/remove)
 *   • Scopes  (chip add/remove)
 *   • Subcategories per domain (chip add/remove, grouped by domain)
 *
 * Removing a domain also drops its subcategory list. Existing tasks
 * that reference a removed domain keep the value on their record —
 * the field just no longer appears in the New Task dropdowns.
 *
 * Props:
 *   settings, setSettings — App-level state
 *   onClose               — () => void
 */
export const SettingsModal = ({ settings, setSettings, onClose }) => {
  const [draft, setDraft] = useState(() => ({
    domains: [...(settings.domains || [])],
    scopes: [...(settings.scopes || [])],
    subcategories: { ...(settings.subcategories || {}) },
    listMode: settings.listMode || 'simple'
  }));
  const [newDomain, setNewDomain] = useState('');
  const [newScope, setNewScope]   = useState('');
  const [newSubcat, setNewSubcat] = useState({});

  // ── Taxonomy mutators ──────────────────────────────────────────
  const addDomain = () => {
    const v = newDomain.trim();
    if (!v || draft.domains.includes(v)) return;
    setDraft(d => ({
      ...d,
      domains: [...d.domains, v],
      subcategories: { ...d.subcategories, [v]: d.subcategories[v] || [] }
    }));
    setNewDomain('');
  };
  const removeDomain = (name) => {
    setDraft(d => {
      const next = { ...d.subcategories };
      delete next[name];
      return { ...d, domains: d.domains.filter(x => x !== name), subcategories: next };
    });
  };

  const addScope = () => {
    const v = newScope.trim();
    if (!v || draft.scopes.includes(v)) return;
    setDraft(d => ({ ...d, scopes: [...d.scopes, v] }));
    setNewScope('');
  };
  const removeScope = (name) => {
    setDraft(d => ({ ...d, scopes: d.scopes.filter(x => x !== name) }));
  };

  const addSubcat = (domain) => {
    const v = (newSubcat[domain] || '').trim();
    const list = draft.subcategories[domain] || [];
    if (!v || list.includes(v)) return;
    setDraft(d => ({
      ...d,
      subcategories: { ...d.subcategories, [domain]: [...list, v] }
    }));
    setNewSubcat(n => ({ ...n, [domain]: '' }));
  };
  const removeSubcat = (domain, name) => {
    setDraft(d => ({
      ...d,
      subcategories: {
        ...d.subcategories,
        [domain]: (d.subcategories[domain] || []).filter(x => x !== name)
      }
    }));
  };

  const handleSave = () => {
    setSettings(s => ({ ...s, ...draft }));
    onClose();
  };

  // Enter-to-add in any input row.
  const onEnter = (fn) => (e) => {
    if (e.key === 'Enter') { e.preventDefault(); fn(); }
  };

  return (
    <div className="cin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cin-modal" style={{ maxWidth: '40rem' }}>
        <div className="cin-modal__head">
          <div className="cin-modal__title">Settings</div>
          <button className="cin-modal__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cin-modal__body">
          {/* List density */}
          <div className="cin-settings-section">
            <div className="cin-settings-section__head">List Density</div>
            <div className="cin-mode-toggle" role="group" aria-label="List density">
              <button
                type="button"
                className={`cin-mode-toggle__btn ${draft.listMode === 'simple' ? 'is-active' : ''}`}
                onClick={() => setDraft(d => ({ ...d, listMode: 'simple' }))}
                aria-pressed={draft.listMode === 'simple'}
              >Simple</button>
              <button
                type="button"
                className={`cin-mode-toggle__btn ${draft.listMode === 'advanced' ? 'is-active' : ''}`}
                onClick={() => setDraft(d => ({ ...d, listMode: 'advanced' }))}
                aria-pressed={draft.listMode === 'advanced'}
              >Advanced</button>
            </div>
            <div className="cin-settings-section__hint">
              Advanced reveals Domain, Scope, and Recurrence columns in the List view.
            </div>
          </div>

          {/* Domains */}
          <div className="cin-settings-section">
            <div className="cin-settings-section__head">Domains</div>
            <div className="cin-chip-row">
              {draft.domains.length === 0 && (
                <span className="cin-chip-row__empty">No domains</span>
              )}
              {draft.domains.map(d => (
                <span key={d} className="cin-chip">
                  {d}
                  <button
                    type="button"
                    className="cin-chip__remove"
                    onClick={() => removeDomain(d)}
                    aria-label={`Remove ${d}`}
                  ><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="cin-chip-input-row">
              <input
                type="text"
                className="cin-input"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={onEnter(addDomain)}
                placeholder="New domain"
              />
              <button type="button" className="cin-btn cin-btn--secondary" onClick={addDomain}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          {/* Scopes */}
          <div className="cin-settings-section">
            <div className="cin-settings-section__head">Scopes</div>
            <div className="cin-chip-row">
              {draft.scopes.length === 0 && (
                <span className="cin-chip-row__empty">No scopes</span>
              )}
              {draft.scopes.map(s => (
                <span key={s} className="cin-chip">
                  {s}
                  <button
                    type="button"
                    className="cin-chip__remove"
                    onClick={() => removeScope(s)}
                    aria-label={`Remove ${s}`}
                  ><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="cin-chip-input-row">
              <input
                type="text"
                className="cin-input"
                value={newScope}
                onChange={(e) => setNewScope(e.target.value)}
                onKeyDown={onEnter(addScope)}
                placeholder="New scope"
              />
              <button type="button" className="cin-btn cin-btn--secondary" onClick={addScope}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          {/* Subcategories per domain */}
          <div className="cin-settings-section">
            <div className="cin-settings-section__head">Subcategories</div>
            {draft.domains.length === 0 ? (
              <div className="cin-settings-section__hint">
                Add at least one domain above to assign subcategories.
              </div>
            ) : (
              draft.domains.map(domain => {
                const list = draft.subcategories[domain] || [];
                return (
                  <div key={domain} className="cin-settings-subgroup">
                    <div className="cin-settings-subgroup__label">{domain}</div>
                    <div className="cin-chip-row">
                      {list.length === 0 && (
                        <span className="cin-chip-row__empty">No subcategories</span>
                      )}
                      {list.map(name => (
                        <span key={name} className="cin-chip">
                          {name}
                          <button
                            type="button"
                            className="cin-chip__remove"
                            onClick={() => removeSubcat(domain, name)}
                            aria-label={`Remove ${name}`}
                          ><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="cin-chip-input-row">
                      <input
                        type="text"
                        className="cin-input"
                        value={newSubcat[domain] || ''}
                        onChange={(e) => setNewSubcat(n => ({ ...n, [domain]: e.target.value }))}
                        onKeyDown={onEnter(() => addSubcat(domain))}
                        placeholder={`Add to ${domain}`}
                      />
                      <button
                        type="button"
                        className="cin-btn cin-btn--secondary"
                        onClick={() => addSubcat(domain)}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="cin-modal__footer">
          <button type="button" className="cin-btn cin-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="cin-btn cin-btn--primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};
