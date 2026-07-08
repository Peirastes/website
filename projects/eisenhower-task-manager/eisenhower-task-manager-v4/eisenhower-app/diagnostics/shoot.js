/**
 * Reusable headless-Chrome screenshot tool for Copilot / ETM UI diagnostics.
 * Captures the live app (http://localhost:3001) at a chosen device viewport and
 * saves a PNG into diagnostics/generated/.
 *
 *   node diagnostics/shoot.js [device] [page] [label]
 *
 *   device : iphone-se | iphone | iphone15pro | iphone-max | ipad | ipad-land | desktop
 *            (default iphone15pro)
 *   page   : chat | etm                    (default chat)
 *   label  : optional filename suffix, e.g. "collapsed" or "keyboard"
 *
 * Examples:
 *   node diagnostics/shoot.js iphone15pro chat
 *   node diagnostics/shoot.js ipad-land etm tabview
 *
 * NOTE: headless Chromium approximates a real device but does NOT show iOS
 * safe-area/notch insets, the on-screen keyboard, standalone-PWA chrome, or
 * exact Safari font rendering. For those, use a real-device screenshot
 * (drop it in diagnostics/device/).
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DEVICES = {
  'iphone-se':   { w: 375,  h: 667,  m: true,  dsf: 2 },
  'iphone':      { w: 390,  h: 844,  m: true,  dsf: 2 },
  'iphone15pro': { w: 393,  h: 852,  m: true,  dsf: 3 },
  'iphone-max':  { w: 430,  h: 932,  m: true,  dsf: 3 },
  'ipad':        { w: 820,  h: 1180, m: true,  dsf: 2 },
  'ipad-land':   { w: 1180, h: 820,  m: true,  dsf: 2 },
  'desktop':     { w: 1280, h: 800,  m: false, dsf: 1 },
};

const deviceArg = process.argv[2] || 'iphone15pro';
const pageArg   = process.argv[3] || 'chat';
const label     = process.argv[4] || '';
const dev = DEVICES[deviceArg] || DEVICES['iphone15pro'];
const URL = pageArg === 'etm' ? 'http://localhost:3001/etm' : 'http://localhost:3001/chat';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9360 + (process.pid % 50);
const OUT_DIR = path.join(__dirname, 'generated');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJSON = (u) => new Promise((res, rej) => { http.get(u, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))); }).on('error', rej); });
const stamp = () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--user-data-dir=' + process.env.TEMP + '\\shoot-' + Date.now(), '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  try {
    let target;
    for (let i = 0; i < 40; i++) { try { const l = await getJSON(`http://localhost:${PORT}/json`); target = l.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch {} await sleep(250); }
    if (!target) throw new Error('Chrome devtools target not found');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let nextId = 1; const pending = new Map();
    const send = (m, p = {}) => new Promise((r) => { const id = nextId++; pending.set(id, r); ws.send(JSON.stringify({ id, method: m, params: p })); });
    await new Promise((r) => ws.addEventListener('open', r));
    ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });

    await send('Emulation.setDeviceMetricsOverride', { width: dev.w, height: dev.h, deviceScaleFactor: dev.dsf, mobile: dev.m });
    await send('Page.enable');
    await send('Page.navigate', { url: URL }); await sleep(900);
    // Skip the gates so we capture the real app: Copilot token + ETM PIN bypass.
    await send('Runtime.evaluate', { expression: "try{localStorage.setItem('copilot_token','2401');sessionStorage.setItem('eisenhower-unlocked','true');}catch(e){}" });
    await send('Page.navigate', { url: URL }); await sleep(3000);

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const name = `${deviceArg}-${pageArg}${label ? '-' + label : ''}-${stamp()}.png`;
    const outPath = path.join(OUT_DIR, name);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log('saved', path.relative(process.cwd(), outPath), `(${dev.w}x${dev.h} @${dev.dsf}x)`);
    ws.close();
  } finally { chrome.kill(); }
})().catch(e => { console.error('shoot.js error:', e.message); process.exit(1); });
