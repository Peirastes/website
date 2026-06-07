import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

/**
 * PHASE 5: cinematic completion modal — acrylic glass, Orbitron
 * title, cinematic rating dots (green for quality, amber for ease).
 * Confirm is disabled until both ratings are picked.
 */
export const CompletionModal = ({ task, onConfirm, onCancel }) => {
  const [qualityRating, setQualityRating] = useState(null);
  const [easeRating, setEaseRating] = useState(null);

  const handleConfirm = () => {
    if (qualityRating === null || easeRating === null) {
      alert('Please rate both quality and ease before confirming completion.');
      return;
    }
    onConfirm(task.id, qualityRating, easeRating);
  };

  return (
    <div className="cin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="cin-modal">
        <div className="cin-modal__head">
          <div className="cin-modal__title">Complete Task</div>
          <button className="cin-modal__close" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cin-modal__body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Task summary */}
            <div className="cin-field">
              <label className="cin-field__label">Task</label>
              <div style={{
                padding: '10px 12px',
                background: 'rgba(8, 12, 18, 0.38)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '3px'
              }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: 'rgba(232, 232, 232, 0.92)',
                  fontWeight: 500
                }}>{task.task}</div>
                {task.subcategory && (
                  <div style={{
                    marginTop: '3px',
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: '10px',
                    letterSpacing: '0.06em',
                    color: 'rgba(180, 180, 180, 0.55)'
                  }}>{task.subcategory}</div>
                )}
              </div>
            </div>

            {/* Quality rating (green) */}
            <div className="cin-rating-row">
              <div className="cin-rating-row__label">How well did you complete this task?</div>
              <div className="cin-rating-dots">
                {[1,2,3,4,5].map(d => (
                  <button
                    key={d}
                    type="button"
                    className={'cin-rating-dot' + (qualityRating !== null && qualityRating >= d ? ' cin-rating-dot--lit-green' : '')}
                    onClick={() => setQualityRating(d)}
                    aria-label={`Rate quality ${d} of 5`}
                  />
                ))}
              </div>
              <div className="cin-rating-row__caption">
                {qualityRating === null ? 'Click to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][qualityRating]}
              </div>
            </div>

            {/* Ease rating (amber) */}
            <div className="cin-rating-row">
              <div className="cin-rating-row__label">How easy/difficult was this task?</div>
              <div className="cin-rating-dots">
                {[1,2,3,4,5].map(d => (
                  <button
                    key={d}
                    type="button"
                    className={'cin-rating-dot' + (easeRating !== null && easeRating >= d ? ' cin-rating-dot--lit-amber' : '')}
                    onClick={() => setEaseRating(d)}
                    aria-label={`Rate ease ${d} of 5`}
                  />
                ))}
              </div>
              <div className="cin-rating-row__caption">
                {easeRating === null ? 'Click to rate' : ['', 'Very Difficult', 'Difficult', 'Moderate', 'Easy', 'Very Easy'][easeRating]}
              </div>
            </div>

            {/* Help text */}
            <div className="cin-field__hint" style={{
              padding: '8px 10px',
              background: 'rgba(8, 12, 18, 0.32)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '3px',
              fontSize: '10px',
              letterSpacing: '0.04em',
              color: 'rgba(180,180,180,0.65)',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'rgba(232,232,232,0.92)' }}>Quality:</strong> Your satisfaction with the result.<br/>
              <strong style={{ color: 'rgba(232,232,232,0.92)' }}>Ease:</strong> How smooth the process was (5 = very easy · 1 = very difficult).
            </div>

          </div>
        </div>

        <div className="cin-modal__footer">
          <button type="button" className="cin-btn cin-btn--secondary" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="cin-btn cin-btn--primary"
            onClick={handleConfirm}
            disabled={qualityRating === null || easeRating === null}
            style={{
              opacity: (qualityRating === null || easeRating === null) ? 0.5 : 1,
              cursor: (qualityRating === null || easeRating === null) ? 'not-allowed' : 'pointer'
            }}
          >
            <CheckCircle size={14} />
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
};
