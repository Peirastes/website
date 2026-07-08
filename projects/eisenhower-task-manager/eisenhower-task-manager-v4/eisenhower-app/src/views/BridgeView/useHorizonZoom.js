import { useEffect } from 'react';
import { nextHorizon } from './projection';

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
      const next = nextHorizon(maxDays, e.deltaY > 0 ? 'out' : 'in');
      if (Math.abs(next - maxDays) < 1e-9) return;
      setMaxDays(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [maxDays, setMaxDays, svgRef]);
};
