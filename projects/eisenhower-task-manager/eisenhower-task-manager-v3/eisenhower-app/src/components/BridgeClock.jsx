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
  const date = now.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div className="bridge-clock" aria-label="Current date and time">
      <span className="bridge-clock__time">{time}</span>
      <span className="bridge-clock__date">{date}</span>
    </div>
  );
};
