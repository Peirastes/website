import React, { useState, useEffect } from 'react';

/**
 * BridgeTelemetry — a slender instrument rail pinned to the Bridge header
 * line, centred between the CHRONOSPHERE wordmark (left) and the live clock
 * (right). Two clusters:
 *   • System-status LEDs (left) — LINK (ETM server), SYNC (write state),
 *     BACKUP (days since export), OVERDUE (past-due task count), PI SERVER
 *     (peirastes-pi reachability).
 *   • Sky readout (right) — current Edmond, OK weather + sunrise/sunset,
 *     via Open-Meteo (free, no API key).
 *
 * Self-contained timers (weather fetch + reachability pings) so those ticks
 * never re-render the (heavy) globe scene. App-derived state (saving,
 * daysSinceExport, overdueCount) arrives as props.
 */

// Edmond, OK — UCO. Fixed so the rail reads as a kiosk instrument (no
// per-load geolocation prompt).
const EDMOND = { lat: 35.6529, lon: -97.4779, tz: 'America/Chicago' };
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${EDMOND.lat}&longitude=${EDMOND.lon}`
  + `&current=temperature_2m,weather_code,is_day&daily=sunrise,sunset`
  + `&temperature_unit=fahrenheit&timezone=${encodeURIComponent(EDMOND.tz)}&forecast_days=1`;

// Peirastes Pi — Tailscale funnel to the shared auth/storage Server (:8787).
const PI_URL = 'https://peirastes-pi.tail6fdfc3.ts.net';

const PING_MS = 45_000;          // LINK + PI reachability cadence
const WEATHER_MS = 15 * 60_000;  // sky refresh cadence
const PING_TIMEOUT = 5_000;

/* fetch with an abort timeout so a hung request can't freeze an LED. */
const ping = (url, opts = {}) => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), PING_TIMEOUT);
  return fetch(url, { cache: 'no-store', ...opts, signal: ctrl.signal })
    .finally(() => clearTimeout(tid));
};

/* WMO weather code → a compact glyph + label. The ︎ variation selector
   forces text (not colour-emoji) rendering so CSS can tint the glyph. */
function describeWeather(code, isDay) {
  const g = (s) => `${s}︎`;
  const clear = isDay ? g('☀') : g('☾');
  if (code === 0)                 return { glyph: clear,    label: 'Clear' };
  if (code === 1 || code === 2)   return { glyph: isDay ? g('⛅') : g('☾'), label: 'Partly Cloudy' };
  if (code === 3)                 return { glyph: g('☁'),   label: 'Overcast' };
  if (code === 45 || code === 48) return { glyph: g('≡'),   label: 'Fog' };
  if (code >= 51 && code <= 57)   return { glyph: g('☂'),   label: 'Drizzle' };
  if (code >= 61 && code <= 67)   return { glyph: g('☂'),   label: 'Rain' };
  if (code >= 71 && code <= 77)   return { glyph: g('❄'),   label: 'Snow' };
  if (code >= 80 && code <= 82)   return { glyph: g('☂'),   label: 'Showers' };
  if (code >= 85 && code <= 86)   return { glyph: g('❄'),   label: 'Snow' };
  if (code >= 95)                 return { glyph: g('⚡'),   label: 'Storm' };
  return { glyph: g('•'), label: '—' };
}

/* Open-Meteo returns local wall-time ISO like "2026-07-05T06:18" (no zone,
   already in America/Chicago). Format to a compact "6:18a". */
function fmtSun(iso) {
  if (!iso || !iso.includes('T')) return '—';
  let [h, m] = iso.split('T')[1].split(':').map(Number);
  const ap = h >= 12 ? 'p' : 'a';
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')}${ap}`;
}

/* Moon phase — computed locally (no API). Days since a known new moon,
   modulo the synodic month, gives phase ∈ [0,1): 0 = new, 0.5 = full. */
const SYNODIC = 29.530588853;                        // mean lunar month (days)
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14, 0); // reference new moon (UTC)
function computeMoon(nowMs = Date.now()) {
  let phase = (((nowMs - NEW_MOON_REF) / 86400000) / SYNODIC) % 1;
  if (phase < 0) phase += 1;
  const illum = Math.round((1 - Math.cos(2 * Math.PI * phase)) / 2 * 100);
  const name =
    phase < 0.02 || phase > 0.98 ? 'New Moon' :
    phase < 0.24 ? 'Waxing Crescent' :
    phase < 0.26 ? 'First Quarter' :
    phase < 0.49 ? 'Waxing Gibbous' :
    phase < 0.51 ? 'Full Moon' :
    phase < 0.74 ? 'Waning Gibbous' :
    phase < 0.76 ? 'Last Quarter' : 'Waning Crescent';
  return { phase, illum, name };
}

/* Tiny SVG moon showing the real illuminated shape. The lit region is bounded
   by the true limb (semicircle r) and the terminator (semi-ellipse of x-radius
   |cos(2π·phase)|·r); sweep flags flip across waxing/waning and crescent/
   gibbous so all eight phases draw correctly. Tinted gold to echo the sun. */
const MoonPhase = ({ phase, size = 13 }) => {
  const r = size / 2;
  const mag = Math.cos(2 * Math.PI * phase);   // +1 new → −1 full
  const rx = Math.abs(mag) * r;
  const waxing = phase <= 0.5;
  const sweepOuter = waxing ? 1 : 0;
  const sweepInner = waxing ? (mag > 0 ? 1 : 0) : (mag > 0 ? 0 : 1);
  const d = `M 0 ${-r} A ${r} ${r} 0 0 ${sweepOuter} 0 ${r} `
          + `A ${rx.toFixed(2)} ${r} 0 0 ${sweepInner} 0 ${-r} Z`;
  return (
    <svg className="bridge-moon" width={size} height={size}
         viewBox={`${-r} ${-r} ${size} ${size}`} aria-hidden="true">
      <circle className="bridge-moon__disk" r={r - 0.5} />
      <path className="bridge-moon__lit" d={d} />
    </svg>
  );
};

/* One LED module: coloured pip + label + optional value. state is one of
   ok | warn | crit | idle. */
const Led = ({ state, label, value, pulse }) => (
  <span className="bridge-tled">
    <span className={`cin-led cin-led--${state}${pulse ? ' cin-led--pulse' : ''}`} />
    <span className="bridge-tled__label">{label}</span>
    {value != null && (
      <span className={`bridge-tled__value bridge-tled__value--${state === 'idle' ? 'ok' : state}`}>{value}</span>
    )}
  </span>
);

export const BridgeTelemetry = ({ saving = false, daysSinceExport = null, overdueCount = 0 }) => {
  const [link, setLink] = useState('idle'); // idle | up | down
  const [pi, setPi] = useState('idle');
  const [weather, setWeather] = useState(null);
  const [moon, setMoon] = useState(() => computeMoon());

  // LINK (ETM server) + PI SERVER reachability — poll on mount then on cadence.
  useEffect(() => {
    let alive = true;
    const check = () => {
      // ETM server: any resolved response (same-origin) means it's up.
      ping('/api/backup-metadata')
        .then(() => alive && setLink('up'))
        .catch(() => alive && setLink('down'));
      // Pi funnel: no-cors reachability probe (opaque resolve = reachable).
      ping(PI_URL, { mode: 'no-cors' })
        .then(() => alive && setPi('up'))
        .catch(() => alive && setPi('down'));
    };
    check();
    const id = setInterval(check, PING_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Edmond weather — fetch on mount then every 15 min.
  useEffect(() => {
    let alive = true;
    const load = () => {
      ping(WEATHER_URL)
        .then((r) => r.json())
        .then((d) => {
          if (!alive || !d || !d.current) return;
          const desc = describeWeather(d.current.weather_code, !!d.current.is_day);
          setWeather({
            temp: d.current.temperature_2m,
            glyph: desc.glyph,
            label: desc.label,
            sunrise: fmtSun(d.daily?.sunrise?.[0]),
            sunset: fmtSun(d.daily?.sunset?.[0]),
          });
        })
        .catch(() => { /* leave last-known / dim placeholder */ });
    };
    load();
    const id = setInterval(load, WEATHER_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Moon phase drifts slowly — recompute hourly so a long-lived kiosk stays true.
  useEffect(() => {
    const id = setInterval(() => setMoon(computeMoon()), 3600_000);
    return () => clearInterval(id);
  }, []);

  // Derive LED states from live inputs.
  const linkState = link === 'up' ? 'ok' : link === 'down' ? 'crit' : 'idle';
  const piState   = pi === 'up' ? 'ok' : pi === 'down' ? 'crit' : 'idle';
  const syncState = saving ? 'warn' : 'ok';
  const backupState = daysSinceExport == null ? 'ok'
    : daysSinceExport >= 21 ? 'crit'
    : daysSinceExport >= 7 ? 'warn' : 'ok';
  const overdueState = overdueCount > 0 ? 'crit' : 'ok';

  return (
    <div className="bridge-telemetry" aria-label="Bridge telemetry">
      {/* Row 1 — system status LEDs. */}
      <div className="bridge-telemetry__row">
        <span className="bridge-telemetry__title"><span className="bridge-telemetry__mark">◇</span> TELEMETRY</span>
        <span className="bridge-telemetry__div" />
        <div className="bridge-telemetry__group">
          <Led state={linkState} label="Link" pulse={link === 'idle'} />
          <Led state={syncState} label="Sync" pulse={saving} />
          <Led state={backupState} label="Backup"
               value={daysSinceExport != null ? `${daysSinceExport}d` : null} />
          <Led state={overdueState} label="Overdue"
               value={overdueCount > 0 ? String(overdueCount) : null} />
          <Led state={piState} label="Pi Server" pulse={pi === 'idle'} />
        </div>
      </div>

      {/* Row 2 — environment: Edmond weather + moon phase. */}
      <div className="bridge-telemetry__row">
        <span className="bridge-telemetry__title"><span className="bridge-telemetry__mark">◇</span> ENVIRONMENT</span>
        <span className="bridge-telemetry__div" />
        <div className="bridge-telemetry__group bridge-telemetry__weather">
          {weather ? (
            <>
              <span className="bridge-telemetry__temp">{Math.round(weather.temp)}°F</span>
              <span className="bridge-telemetry__cond">
                <span className="bridge-telemetry__glyph">{weather.glyph}</span>{weather.label}
              </span>
              <span className="bridge-telemetry__sun">↑{weather.sunrise} ↓{weather.sunset}</span>
            </>
          ) : (
            <span className="bridge-telemetry__cond bridge-telemetry__cond--dim">Edmond · —</span>
          )}
          <span className="bridge-telemetry__moon" title={`${moon.name} · ${moon.illum}% illuminated`}>
            <MoonPhase phase={moon.phase} />
            <span className="bridge-telemetry__moontxt">{moon.name} {moon.illum}%</span>
          </span>
        </div>
      </div>
    </div>
  );
};
