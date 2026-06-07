import { useEffect } from 'react';
import { HORIZON_BREAKPOINTS } from './projection';

/**
 * Breakpoint-snap wheel zoom for the Horizon scene. Each scroll click
 * lands on the next-larger (zoom out) or next-smaller (zoom in)
 * horizon distance in HORIZON_BREAKPOINTS. In-between values aren't
 * reachable — every zoom level is a curated calendar unit (15min,
 * 30min, 1hr, 3hr, …, 14d, 30d, 90d, 365d).
 *
 * @param svgRef        React ref to the SVG element to listen on.
 * @param maxDays       Current horizon distance.
 * @param setMaxDays    Updater for the horizon distance.
 */
export const useHorizonZoom = (svgRef, maxDays, setMaxDays) => {
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !setMaxDays) return;
    const handler = (e) => {
      e.preventDefault();
      let next;
      if (e.deltaY > 0) {
        // Zoom OUT — smallest breakpoint strictly greater than current.
        next = HORIZON_BREAKPOINTS.find(bp => bp > maxDays + 1e-9)
            ?? HORIZON_BREAKPOINTS[HORIZON_BREAKPOINTS.length - 1];
      } else {
        // Zoom IN — largest breakpoint strictly less than current.
        next = [...HORIZON_BREAKPOINTS].reverse().find(bp => bp < maxDays - 1e-9)
            ?? HORIZON_BREAKPOINTS[0];
      }
      if (Math.abs(next - maxDays) < 1e-9) return;
      setMaxDays(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [maxDays, setMaxDays, svgRef]);
};
