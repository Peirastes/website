import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * BootOverlay — cinematic PIN unlock gate (Phase 2)
 *
 * Replaces v2's PINModal. Same PIN validation (PIN '2401', 5 attempts max,
 * sessionStorage flag), restyled into the Peirastes Cinematic Tier:
 *   - Acrylic-glass keypad with cyan hover / amber press
 *   - 4 PIN dots that fill amber as digits are entered
 *   - On wrong PIN: shake animation, red dots, error message
 *   - On 5 wrong PINs: locked state, keypad disabled
 *   - On correct PIN: keypad flash, overlay fades, scan-line sweeps,
 *     onUnlock callback fires after ~1.5s (gives time for the amber
 *     scan-line to traverse the viewport and the chrome behind to start
 *     fading in)
 *   - Keyboard input: 0-9, Backspace (del), Esc (clear)
 *
 * Props:
 *   onUnlock — callback fired after the unlock animation completes.
 */
export const BootOverlay = ({ onUnlock }) => {
  const [entry, setEntry] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sweep, setSweep] = useState(false);

  const CORRECT_PIN = '2401';
  const MAX_ATTEMPTS = 5;
  const locked = attempts >= MAX_ATTEMPTS;

  const keypadRef = useRef(null);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  const triggerWrongPIN = useCallback(() => {
    setShake(true);
    setEntry('');
    const next = attempts + 1;
    setAttempts(next);
    if (next >= MAX_ATTEMPTS) {
      setError(`Locked · Maximum attempts exceeded · Refresh to retry`);
    } else {
      setError(`Access denied · ${MAX_ATTEMPTS - next} attempts remaining`);
    }
    setTimeout(() => setShake(false), 400);
  }, [attempts]);

  const triggerUnlock = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    sessionStorage.setItem('eisenhower-unlocked', 'true');

    // Beat 1: keypad flash (300ms via .flash class), tag triggers the
    // .pin-keypad.flash animation in cinematic.css.
    if (keypadRef.current) keypadRef.current.classList.add('flash');

    // Beat 2 (t=320ms): fade out overlay, kick off scan-line sweep.
    setTimeout(() => {
      setHidden(true);
      setSweep(true);
    }, 320);

    // Beat 3 (t=440ms): remove body.app-locked so the chrome behind us
    // starts its cin-fade-in cascade. The scan-line is still sweeping
    // overhead at this point, which makes the chrome appear "in time
    // with" the curtain rising.
    setTimeout(() => {
      document.body.classList.remove('app-locked');
    }, 440);

    // Beat 4 (t=1500ms): scan-line has crossed the viewport. Fire the
    // parent onUnlock callback so App.jsx flips state and proceeds.
    setTimeout(() => {
      onUnlockRef.current && onUnlockRef.current();
    }, 1500);
  }, [animating]);

  const tryAddDigit = useCallback((d) => {
    if (animating || locked) return;
    setEntry((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + d;
      if (next.length === 4) {
        // Wait briefly so the 4th dot reads as "entered" before validating
        setTimeout(() => {
          if (next === CORRECT_PIN) {
            setError('');
            triggerUnlock();
          } else {
            triggerWrongPIN();
          }
        }, 220);
      }
      return next;
    });
  }, [animating, locked, triggerUnlock, triggerWrongPIN]);

  const tryDel = useCallback(() => {
    if (animating || locked) return;
    setEntry((prev) => prev.slice(0, -1));
  }, [animating, locked]);

  const tryClear = useCallback(() => {
    if (animating || locked) return;
    setEntry('');
  }, [animating, locked]);

  // Hardware keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key >= '0' && e.key <= '9') {
        pressKey(e.key);
        tryAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        pressKey('del');
        tryDel();
      } else if (e.key === 'Escape') {
        pressKey('clr');
        tryClear();
      }
    };
    function pressKey (k) {
      const btn = keypadRef.current && keypadRef.current.querySelector(`[data-key="${k}"]`);
      if (!btn) return;
      btn.classList.add('press');
      setTimeout(() => btn.classList.remove('press'), 140);
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tryAddDigit, tryDel, tryClear]);

  // Make sure body.app-locked is applied while this overlay is mounted
  // (suppresses chrome animations until unlock removes it).
  useEffect(() => {
    document.body.classList.add('app-locked');
    return () => document.body.classList.remove('app-locked');
  }, []);

  return (
    <>
      <div
        className={'boot-overlay' + (hidden ? ' hide' : '')}
        aria-label="Authorization required"
        role="dialog"
        aria-modal="true"
      >
        <div className="boot-title">
          <div className="boot-title__name">Eisenhower Task Manager</div>
          <div className={'boot-title__status' + (locked ? ' boot-title__status--locked' : '')}>
            {locked ? 'System Locked' : 'Awaiting Authorization'}
          </div>
        </div>

        <div
          className={'pin-display' + (shake ? ' shake' : '')}
          aria-label="PIN entry — 4 digits"
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={'pin-dot' + (i < entry.length ? ' pin-dot--filled' : '')}
              data-pos={i}
            />
          ))}
        </div>

        <div className="pin-keypad" ref={keypadRef} aria-disabled={locked}>
          {['1','2','3','4','5','6','7','8','9'].map((d) => (
            <button
              key={d}
              className="pin-key"
              data-key={d}
              onClick={() => tryAddDigit(d)}
              disabled={locked}
            >{d}</button>
          ))}
          <button
            className="pin-key pin-key--util"
            data-key="del"
            onClick={tryDel}
            disabled={locked}
          >Del</button>
          <button
            className="pin-key"
            data-key="0"
            onClick={() => tryAddDigit('0')}
            disabled={locked}
          >0</button>
          <button
            className="pin-key pin-key--util"
            data-key="clr"
            onClick={tryClear}
            disabled={locked}
          >Clr</button>
        </div>

        <div className="boot-hint">
          {error ? (
            <span className="boot-hint__error">{error}</span>
          ) : (
            <>Enter 4-digit access code &middot; Keyboard input accepted &middot; Esc to clear</>
          )}
        </div>
      </div>

      <div
        className={'boot-scanline' + (sweep ? ' sweep' : '')}
        aria-hidden="true"
      />
    </>
  );
};
