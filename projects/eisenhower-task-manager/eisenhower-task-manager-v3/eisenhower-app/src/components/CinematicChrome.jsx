import React from 'react';

/**
 * CinematicChrome — Peirastes chrome row + corner ticks (Phase 2)
 *
 * Fixed-positioned chrome that frames the v2 app from the top:
 *   - Left flank: PEIRASTES wordmark (Cinzel, links back to peirastes.com)
 *                 + version label below
 *   - Center: instrument title (Orbitron, gold) + subtitle (Inter, cyan)
 *             + optional crew line (Inter, dim)
 *   - Right flank: action button row (Info + Settings glyphs — each renders
 *     only when its handler prop is provided; no placeholder disabled cogs)
 *   - Four cartographic L-bracket ticks at viewport corners
 *
 * Title gets top:1.2rem (vs flanks at 1.6rem) so the 3-line block's
 * visual center aligns with the wordmark's center — see CD memory.
 *
 * Props:
 *   title       — instrument name (defaults to "Eisenhower Task Manager")
 *   sub         — line under the title
 *   crew        — third line under the title (hidden on narrow screens)
 *   version     — text below the wordmark (e.g., "v3.0")
 *   onInfo      — handler for the Info button (renders only if provided)
 *   onSettings  — handler for the Settings button (renders only if provided)
 */
export const CinematicChrome = ({
  title    = 'Eisenhower Task Manager',
  sub      = 'Operations — Task Prioritization Console',
  crew     = 'Critical · Strategic · Delegate · Eliminate',
  version  = 'v3.0',
  onInfo,
  onSettings
}) => {
  // Split a one-line title so the LAST word is wrapped in a span for the
  // cinematic .cin-title__name span color treatment (matches the canonical
  // "Artemis II" pattern where "II" is the spanned tail).
  const titleParts = (() => {
    const trimmed = String(title).trim();
    const idx = trimmed.lastIndexOf(' ');
    if (idx === -1) return { head: '', tail: trimmed };
    return { head: trimmed.slice(0, idx + 1), tail: trimmed.slice(idx + 1) };
  })();

  return (
    <>
      {/* Left flank */}
      <div className="cin-flank cin-flank--left">
        <a
          className="cin-wordmark"
          href="https://peirastes.com/"
          title="Back to Peirastes"
        >PEIRASTES</a>
        {version && <span className="cin-version">{version}</span>}
      </div>

      {/* Center title */}
      <div className="cin-title" aria-label={`${title} — ${sub}`}>
        <div className="cin-title__name">
          {titleParts.head}<span>{titleParts.tail}</span>
        </div>
        {sub  && <div className="cin-title__sub">{sub}</div>}
        {crew && <div className="cin-title__crew">{crew}</div>}
      </div>

      {/* Right flank — action buttons */}
      <div className="cin-flank cin-flank--right">
        <div className="cin-action-row">
          {onInfo && (
            <button
              className="cin-action"
              onClick={onInfo}
              title="About this app"
              aria-label="About"
            >
              <span className="cin-action__glyph">&#9432;</span>
            </button>
          )}
          {onSettings && (
            <button
              className="cin-action"
              onClick={onSettings}
              title="Settings"
              aria-label="Settings"
            >
              <span className="cin-action__glyph">&#9881;</span>
            </button>
          )}
        </div>
      </div>

      {/* Corner ticks */}
      <div className="cin-tick cin-tick--tl" aria-hidden="true" />
      <div className="cin-tick cin-tick--tr" aria-hidden="true" />
      <div className="cin-tick cin-tick--bl" aria-hidden="true" />
      <div className="cin-tick cin-tick--br" aria-hidden="true" />
    </>
  );
};
