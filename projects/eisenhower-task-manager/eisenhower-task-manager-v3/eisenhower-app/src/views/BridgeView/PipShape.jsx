import React from 'react';

/* Bridge marker helpers, shared by the Horizon (globe) and Radar scenes.
   Tasks render as round dots (each scene draws its own circle + blip + ring).
   Calendar EVENTS render as duration-proportional bars via <EventBlock>: the
   longer the event, the longer the rectangle, with a steady quadrant-hued glow
   and no blip pulse.

   ONE definition of "event" drives the whole app: the `isEvent` flag (set by
   the task form's "Calendar event" toggle) is authoritative — the same flag
   List / Matrix / Gantt / Analytics filter on — so a task marked as an event
   both drops off the tasklist AND draws as a Bridge timebar. The legacy
   subcategory 'Schedule' / 'evt-' id checks stay as back-compat fallbacks. */

export const isEventTask = (t) =>
  t.isEvent === true || t.subcategory === 'Schedule' || String(t.id).startsWith('evt-');

/* Event length in minutes, read from the time-estimate fields (events store
   their block length there). Floored at a 15-minute MINIMUM bar length, so no
   event ever renders shorter than a quarter-hour block (this also covers the
   duration-less case, which lands on the 15-minute floor). */
export const EVENT_MIN_MINUTES = 15;
export const durationMin = (t) => {
  const v = Number(t.timeEstimateValue) || 0;
  const u = t.timeEstimateUnit || 'minutes';
  const m = u === 'hours' ? v * 60 : u === 'days' ? v * 480 : u === 'weeks' ? v * 2400 : v;
  return Math.max(m, EVENT_MIN_MINUTES);
};

/* A calendar EVENT band: a stroked polyline that follows the projected TIME
   axis from the event's start, so on the globe it BENDS along the surface and
   wraps over the horizon rather than sticking out as a straight tangent. `pts`
   is the pre-projected screen-space polyline (each scene builds it — a curved
   walk on the globe, a straight radial on the flat radar); `thick` is the
   stroke width. Round caps read as a rounded calendar block. Shares the pip's
   colour classes so quadrant hue / overdue / done styling all apply. */
export const EventBlock = ({ pts, thick, className, style }) => {
  if (!pts || pts.length < 2) return null;
  const d = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return <polyline points={d} fill="none" strokeWidth={thick}
                   strokeLinecap="round" strokeLinejoin="round"
                   className={className} style={style} />;
};
