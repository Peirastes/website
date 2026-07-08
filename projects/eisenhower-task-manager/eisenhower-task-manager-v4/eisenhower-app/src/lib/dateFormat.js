/**
 * Date / time / horizon formatting helpers used across the Bridge,
 * Calendar, and TaskForm views. Pure functions — no React, no state.
 *
 * Conventions:
 *   - `dueDate` is "YYYY-MM-DD" (date only).
 *   - `dueTime` is "HH:MM" or "" (optional time of day).
 *   - "Horizon distance" is fractional days (so sub-day reads in hours).
 *   - "effOff" (effective offset) is signed fractional days from the
 *     panned ship; +ahead, -behind.
 */

/** Splits a legacy "YYYY-MM-DDTHH:MM" string into {date, time}, or
 *  passes through a date-only string. Safe on undefined / empty. */
export const splitDueDate = (raw) => {
  if (typeof raw !== 'string' || !raw) return { date: '', time: '' };
  if (raw.includes('T')) {
    const [d, t] = raw.split('T');
    return { date: d, time: (t || '').slice(0, 5) };
  }
  return { date: raw, time: '' };
};

/** Long-form horizon distance — e.g. "1 DAY", "14 DAYS", "6 HOURS".
 *  Used for milestone-arc captions on the Bridge. */
export const formatHorizonLong = (days) => {
  if (days < 1) {
    const h = Math.max(1, Math.round(days * 24));
    return h === 1 ? '1 HOUR' : `${h} HOURS`;
  }
  const d = Math.round(days);
  return d === 1 ? '1 DAY' : `${d} DAYS`;
};

/** Short-form horizon distance — "6h", "14d". Used in the subtitle. */
export const formatHorizonShort = (days) => {
  if (days < 1) return `${Math.max(1, Math.round(days * 24))}h`;
  return `${Math.round(days)}d`;
};

const BRIDGE_MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/** Absolute date/time label for a calendar-anchored grid arc on the
 *  Bridge. Sub-day granularity prints wall-clock ("14:30"); coarser
 *  prints "JUN 13", with year suffix when crossing into a future year. */
export const formatAbsolute = (refMs, granularityDays) => {
  const d = new Date(refMs);
  if (granularityDays < 1) {
    const h = d.getHours();
    const m = d.getMinutes();
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  const month = BRIDGE_MONTH_ABBR[d.getMonth()];
  const day = d.getDate();
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return sameYear
    ? `${month} ${day}`
    : `${month} ${day} '${String(d.getFullYear()).slice(-2)}`;
};

/** Full "date · time" readout — ALWAYS shows both the calendar date and
 *  the wall-clock time, at every horizon scale. This is the shared model
 *  for the three stacked Bridge time references (NOW / VIEWING / HORIZON):
 *  a label on top, this date·time line below. Unlike formatAbsolute it
 *  never drops the date at sub-day scales nor the time at coarse ones. */
export const formatDateTime = (refMs) => {
  const d = new Date(refMs);
  const month = BRIDGE_MONTH_ABBR[d.getMonth()];
  const day = d.getDate();
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const dateStr = sameYear
    ? `${month} ${day}`
    : `${month} ${day} '${String(d.getFullYear()).slice(-2)}`;
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${dateStr} · ${h}:${String(m).padStart(2, '0')} ${ampm}`;
};

/** Right-side relative-from-ship label on a calendar-anchored grid arc.
 *  Direction (ahead vs behind) is implied visually so suffix is omitted. */
export const formatRelative = (effOff) => {
  if (Math.abs(effOff) < 1/48) return 'NOW';
  const sign = effOff < 0 ? '-' : '';
  const abs = Math.abs(effOff);
  if (abs < 1)   return `${sign}${Math.round(abs * 24)}H`;
  if (abs < 14)  return `${sign}${Math.round(abs)}D`;
  if (abs < 60)  return `${sign}${Math.round(abs / 7)}W`;
  if (abs < 365) return `${sign}${Math.round(abs / 30)}MO`;
  return `${sign}${Math.round(abs / 365)}Y`;
};

/** Ship anchor label — "TODAY" / "12H AHEAD" / "3D AGO" / etc. */
export const formatAnchor = (anchor) => {
  if (Math.abs(anchor) < 1/48) return 'TODAY';
  const abs = Math.abs(anchor);
  const suffix = anchor > 0 ? 'AHEAD' : 'AGO';
  if (abs < 1)   return `${Math.round(abs * 24)}H ${suffix}`;
  if (abs < 14)  return `${Math.round(abs)}D ${suffix}`;
  if (abs < 60)  return `${Math.round(abs / 7)}W ${suffix}`;
  if (abs < 365) return `${Math.round(abs / 30)}MO ${suffix}`;
  return `${Math.round(abs / 365)}Y ${suffix}`;
};
