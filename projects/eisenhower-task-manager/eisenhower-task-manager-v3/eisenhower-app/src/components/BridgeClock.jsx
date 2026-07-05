import React, { useState, useEffect } from 'react';

/**
 * Live wall-clock for the Bridge header — a real date/time readout pinned
 * top-right (above the Command frame), mirroring the Chronosphere title on
 * the left. Self-contained state + a 1s tick so only THIS component
 * re-renders each second; the (heavy) globe scene is never re-rendered by
 * the clock. Distinct from the on-globe NOW/VIEWING/HORIZON readouts: this
 * is the plain real-world clock, always ticking regardless of the view.
 */
export const BridgeClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  });
  // Fully-spelled date with an ordinal day — "Sunday, July 5th, 2026".
  // (toLocaleDateString has no ordinal option, so build the suffix by hand.)
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  const month = now.toLocaleDateString(undefined, { month: 'long' });
  const d = now.getDate();
  const suffix = (n) => {
    const v = n % 100;
    return (v >= 11 && v <= 13) ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  };
  const date = `${weekday}, ${month} ${d}${suffix(d)}, ${now.getFullYear()}`;

  return (
    <div className="bridge-clock" aria-label="Current date and time">
      <span className="bridge-clock__time">{time}</span>
      <span className="bridge-clock__date">{date}</span>
    </div>
  );
};
