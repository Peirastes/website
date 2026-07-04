import React from 'react';

/**
 * CinematicChrome — centered instrument title for the standalone app.
 *
 * 2026-06-19: ETM is a dedicated app, not a website module — so the
 * peirastes.com wordmark callback link, the four corner ticks, and the
 * Info/Settings action buttons were removed here. Info + Settings now live
 * in the bottom action bar (the control panel). Only the centered title
 * remains as the app identity.
 *
 * Props:
 *   title — instrument name (defaults to "Eisenhower Task Manager")
 *   sub   — line under the title
 *   crew  — third line under the title (hidden on narrow screens)
 */
export const CinematicChrome = ({
  title = 'Eisenhower Task Manager',
  sub   = 'Operations — Task Prioritization Console',
  crew  = 'Critical · Strategic · Delegate · Eliminate'
}) => {
  // Split the title so the LAST word is spanned for the .cin-title__name span
  // color treatment (matches the canonical "Artemis II" pattern).
  const titleParts = (() => {
    const trimmed = String(title).trim();
    const idx = trimmed.lastIndexOf(' ');
    if (idx === -1) return { head: '', tail: trimmed };
    return { head: trimmed.slice(0, idx + 1), tail: trimmed.slice(idx + 1) };
  })();

  return (
    <div className="cin-title" aria-label={`${title} — ${sub}`}>
      <div className="cin-title__name">
        {titleParts.head}<span>{titleParts.tail}</span>
      </div>
      {sub  && <div className="cin-title__sub">{sub}</div>}
      {crew && <div className="cin-title__crew">{crew}</div>}
    </div>
  );
};
