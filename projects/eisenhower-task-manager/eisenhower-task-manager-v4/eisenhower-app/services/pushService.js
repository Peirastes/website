const fs = require('fs-extra');
const path = require('path');
const webpush = require('web-push');

// Web Push (Phase 2 of background jobs): notify the phone when a job finishes
// even if the Copilot is closed/backgrounded. VAPID keypair is generated once
// and persisted; browser push subscriptions are stored server-side.
// NOTE: push + service workers require a SECURE CONTEXT — works on localhost or
// over HTTPS (e.g. Tailscale Serve). Over plain-HTTP Tailscale it's unavailable;
// the client guards on feature support so it degrades to in-app toasts only.

const DATA_DIR = path.join(__dirname, '..', 'data');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');
const SUBS_FILE = path.join(DATA_DIR, 'push-subs.json');
const SUBJECT = 'mailto:cprather3@uco.edu';

fs.ensureDirSync(DATA_DIR);

let vapid;
try {
  vapid = fs.readJsonSync(VAPID_FILE);
} catch {
  vapid = webpush.generateVAPIDKeys();
  try { fs.writeJsonSync(VAPID_FILE, vapid, { spaces: 2 }); } catch {}
}
webpush.setVapidDetails(SUBJECT, vapid.publicKey, vapid.privateKey);

function loadSubs() { try { return fs.readJsonSync(SUBS_FILE); } catch { return []; } }
function saveSubs(subs) { try { fs.writeJsonSync(SUBS_FILE, subs, { spaces: 2 }); } catch {} }

function getPublicKey() { return vapid.publicKey; }

function addSubscription(sub) {
  if (!sub || !sub.endpoint) throw new Error('invalid subscription');
  const subs = loadSubs();
  if (!subs.find(s => s.endpoint === sub.endpoint)) { subs.push(sub); saveSubs(subs); }
  return { count: subs.length };
}

function removeSubscription(endpoint) {
  if (!endpoint) return;
  saveSubs(loadSubs().filter(s => s.endpoint !== endpoint));
}

async function sendToAll(payload) {
  const subs = loadSubs();
  if (!subs.length) return { sent: 0 };
  const data = JSON.stringify(payload);
  let sent = 0; const dead = [];
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification(s, data); sent++; }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) dead.push(s.endpoint); }
  }));
  if (dead.length) saveSubs(loadSubs().filter(s => !dead.includes(s.endpoint)));
  return { sent, removed: dead.length };
}

// Notify on a finished job. Skip very short *successful* jobs (not worth a buzz);
// always notify on failure / stop / timeout.
function notifyJobDone(rec) {
  const dur = (rec.startedAt && rec.endedAt) ? (Date.parse(rec.endedAt) - Date.parse(rec.startedAt)) / 1000 : 0;
  if (rec.status === 'completed' && dur < 8) return Promise.resolve({ sent: 0, skipped: true });
  const mark = rec.status === 'completed' ? '✅' : (rec.status === 'failed' || rec.status === 'timed-out') ? '❌' : '⏹';
  return sendToAll({
    title: `${mark} ${rec.label}`,
    body: `Job ${rec.status}${rec.exitCode != null ? ` · exit ${rec.exitCode}` : ''}`,
    tag: 'job-' + rec.id,
    url: '/chat',
    jobId: rec.id
  });
}

module.exports = { getPublicKey, addSubscription, removeSubscription, sendToAll, notifyJobDone };
