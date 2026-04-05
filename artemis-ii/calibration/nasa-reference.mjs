// NASA Artemis II mission reference data.
// All times are T+ seconds from launch (April 1, 2026 22:35:12 UTC).
// Sources are NASA blogs, press releases, and Wikipedia mission article.
//
// Status flags:
//   confirmed — NASA has published a specific time for this event
//   derived   — computed from other confirmed times (e.g. burn end = start + duration)
//   estimated — rough figure from NASA descriptions ("about", "~")
//   canceled  — event was planned but did not occur
//   ghost     — label-only event that affects no physics (display timestamp)

export const LAUNCH_UTC_MS = new Date('2026-04-01T22:35:12Z').getTime();

/**
 * Convert a UTC ISO string to T+ seconds from launch.
 */
function tPlus(isoUtc) {
  return (new Date(isoUtc).getTime() - LAUNCH_UTC_MS) / 1000;
}

/**
 * Convert T+ seconds to UTC ISO string for display.
 */
export function tPlusToUtc(seconds) {
  return new Date(LAUNCH_UTC_MS + seconds * 1000).toISOString();
}

/**
 * Format T+ as readable "Xd Xh Xm Xs".
 */
export function formatTPlus(seconds) {
  const sign = seconds < 0 ? '-' : '+';
  let s = Math.abs(Math.round(seconds));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600);  s -= h * 3600;
  const m = Math.floor(s / 60);    s -= m * 60;
  const parts = [];
  if (d) parts.push(d + 'd');
  if (h || d) parts.push(h + 'h');
  if (m || h || d) parts.push(m + 'm');
  parts.push(s + 's');
  return sign + parts.join(' ');
}

// ---- Reference events in chronological order ----
// Each event has a key, label, t (T+ seconds), status, source, notes.
// `weight` controls calibration priority: 1.0 = must match exactly, 0.0 = informational.

export const NASA_EVENTS = [
  {
    key: 'launch',
    label: 'Launch',
    t: 0,
    status: 'confirmed',
    weight: 1.0,
    source: 'NASA Artemis II Launch Day Updates',
    notes: 'April 1, 2026, 22:35:12 UTC (6:35:12 PM EDT)',
  },
  {
    key: 'srb_sep',
    label: 'SRB separation',
    t: 126,
    status: 'estimated',
    weight: 0.3,
    source: 'Wikipedia (altitude 48 km, speed 5000 km/h)',
    notes: 'Matches Artemis I reference profile',
  },
  {
    key: 'meco',
    label: 'MECO (core stage burnout)',
    t: 480,
    status: 'estimated',
    weight: 0.3,
    source: 'Wikipedia ("about eight minutes")',
    notes: 'Places Orion in highly elliptical orbit',
  },
  {
    key: 'icps_perigee_raise',
    label: 'ICPS perigee raise burn',
    t: 3000,
    status: 'estimated',
    weight: 0.5,
    source: 'Wikipedia ("about 50 minutes after liftoff")',
    notes: 'Fires at apogee of MECO ellipse',
  },
  {
    key: 'icps_heo_burn',
    label: 'ICPS HEO burn (15 min)',
    t: 3900,
    status: 'estimated',
    weight: 0.5,
    source: 'Wikipedia',
    notes: 'Establishes 23.5-hour high Earth orbit. 15-min burn duration.',
  },
  {
    key: 'tli_start',
    label: 'TLI burn start',
    t: 90828,  // April 2, 23:49:00 UTC — confirmed by NASA blog
    status: 'confirmed',
    weight: 1.0,
    source: 'NASA blog: "Flight Day 2: Orion Completes TLI Burn", Space.com',
    notes: 'April 2, 2026 7:49 PM EDT = 23:49 UTC. 5m50s burn, AJ10 ESM engine, 1274 ft/s = 0.388 km/s delta-v, ~1000 lbs propellant',
  },
  {
    key: 'tli_end',
    label: 'TLI burn end',
    t: 91178,  // +350s for 5m50s duration
    status: 'derived',
    weight: 0.8,
    source: 'TLI start + 5m50s duration (NASA)',
    notes: 'Places spacecraft on free-return trajectory',
  },
  {
    key: 'otc1',
    label: 'Outbound TCM-1',
    t: null,
    status: 'canceled',
    weight: 0,
    source: 'NASA blog: "Flight Day 3 Outbound Trajectory Correction Burn Update"',
    notes: 'CANCELED — trajectory was already on correct path. Do not include as event in sim.',
  },
  {
    key: 'lunar_flyby',
    label: 'Lunar closest approach (perilune)',
    t: 432420,  // April 6, 23:02 UTC = T+5d 0h 27m
    status: 'confirmed',
    weight: 1.0,
    source: 'NASA press release, Wikipedia',
    notes: 'April 6, 2026, 23:02 UTC (7:02 PM EDT). Closest approach 4,066 mi (6,546 km) from lunar surface (far side)',
    altKm: 6546,
  },
  {
    key: 'max_distance',
    label: 'Maximum distance from Earth',
    t: 432600,  // April 6, 23:05 UTC (3 min after perilune)
    status: 'confirmed',
    weight: 0.8,
    source: 'NASA press release',
    notes: '406,700 km (252,757 mi) — beats Apollo 13 record by 4,102 mi',
    distKm: 406700,
  },
  {
    key: 'splashdown',
    label: 'Splashdown',
    t: 783480,  // April 11, 00:21 UTC = T+9d 1h 46m
    status: 'confirmed',
    weight: 1.0,
    source: 'NASA press release, Wikipedia',
    notes: 'NET April 11, 2026 00:21 UTC (April 10, 5:21 PM PDT). Pacific Ocean near San Diego',
  },
];

// Secondary measurements (not event times, but trajectory properties)
export const NASA_PARAMS = {
  heoOrbitPeriod: 23.5 * 3600,      // seconds; 23.5-hour HEO orbit
  heoApogeeKm:    76757,             // derived from 23.5h period, rPeri=6563
  tliDvMs:        388,               // 0.388 km/s = 1274 ft/s (NASA stated)
  tliDurationS:   350,               // 5m50s
  periluneAltKm:  6546,              // 4066 mi closest approach
  maxDistKm:      406700,            // from Earth at peak
  splashdownMs:   783480,            // seconds
};

/**
 * Compare a simulated event time to the NASA reference.
 * Returns { deltaSec, deltaHuman, ok } where ok is true if within tolerance.
 */
export function compareEvent(nasaEvent, simT, toleranceSec = 60) {
  if (nasaEvent.t == null) return { deltaSec: null, deltaHuman: 'n/a', ok: true };
  const d = simT - nasaEvent.t;
  return {
    deltaSec: d,
    deltaHuman: formatTPlus(d),
    ok: Math.abs(d) <= toleranceSec,
  };
}
