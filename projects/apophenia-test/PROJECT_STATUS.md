# PROJECT STATUS — The Apophenia Filter

**The single "where am I / how do I resume" doc for this project.** Read this first when you
pick it back up. The design contract is `apophenia-filter-handoff.md` (v0.4.0, 2026-07-01) — still
the authority on the *methodology and invariants*, but stale on backend, classifier, palette, and
copy. Where the two disagree on *as-built facts*, **this doc wins** (see §9 for the exact deltas).

- **Owner:** Cole Prather (Peirastes)
- **Instrument version:** v0.4.1
- **Stage:** Private prototyping / pilot — **NOT advertised, not linked from nav.** Live but quiet.
- **Last updated:** 2026-07-05

---

## 1. TL;DR — state of play

The instrument is built, reskinned into the Cinematic tier, QA'd, and deployed live at
`peirastes.com/apophenia-filter/`. The classifier was hardened (exact binomial test). A project page
with the on-site paper is up. **Anonymous data collection is live and working** — self-hosted on the
Raspberry Pi (not Supabase), with no IP stored, so privacy is upheld. An **optional** account layer
gives *the owner* a personal longitudinal dashboard, kept strictly separate from the anonymous
research pool. Server is keep-alive-hardened with Discord alerts (down-alerts + new-submission
pings). The population-analytics pipeline is validated end-to-end against a synthetic population.

**What's left before going public:** collect a handful of real pilot sessions (friends, `pilot` flag
ON), then — if it looks publication-worthy — send the IRB inquiry to UCO. Public data collection for
publication only starts after IRB determination. **Any data collected before IRB determination is
knowingly disposable and will be tossed from any publication assessment** (owner's standing call).

---

## 2. Deployment gate — where we are in the sequence

Per handoff §8, the launch sequence is: **(1) private pilot → (2) IRB inquiry → (3) public launch.**

- **[✓ DONE] Gate 1 groundwork:** page built, instrument live, QA pass complete, data collection
  stood up and proven. Contribution works on all networks including the owner's own tailnet.
- **[→ HERE] Gate 1 remainder:** get a few friends to run it (pilot flag ON) and shake out bugs on
  real devices. This is the current step.
- **[ ] Gate 2:** owner sends the IRB inquiry (anonymous, uncompensated, public web behavioral task,
  no identifiers, opt-in post-task contribution, minimal risk). Only after determination does
  publication-intended collection begin.
- **[ ] Gate 3:** advertise / link from nav, freeze PARAMS_HASH, announce publicly.

The instrument is technically public-*reachable* today, but it is **not advertised** — that's the
deliberate "quiet pilot" posture.

---

## 3. As-built architecture (this is the current truth)

### 3.1 Two copies of the app — keep them in sync
- **Pi primary (interactive):** served from the Pi at `…tail6fdfc3.ts.net/apophenia/index.html`
  (files in `~/Server/public/apophenia/`). This is the copy that has login + personal history and
  same-origin data endpoints. **This is what users actually play.**
- **GitHub fallback (anonymous-only):** the Vite build committed at `apophenia-filter/dist/`. No
  account features; used if the Pi is down.
- **`apophenia-filter/index.html` is a redirect** (meta-refresh + JS) to the Pi copy, with a fallback
  link to the anonymous GitHub build. This is why the peirastes.com link works everywhere including
  the owner's tailnet: a *top-level navigation* is not blocked by Chrome's Local Network Access
  check, whereas a cross-origin *fetch* from a public page to a tailnet-private IP was
  (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`). Serving the app from the Pi makes the data call
  same-origin, sidestepping LNA entirely.
- **Reliability tradeoff the owner accepted:** playing now needs the Pi up. Keep-alive + monitor
  cover this (§6).

### 3.2 Endpoints (all on the Pi's zero-dependency Node server, `127.0.0.1:8787` behind the funnel)
- **Anonymous research pool** — `POST /api/contrib/apophenia-filter`
  - Append-only JSONL at `~/Server/data/contrib-apophenia-filter.jsonl`, `chmod 600`, write-only
    (no public GET). Stores `{received_at: <day-granularity>, payload}`.
  - **No IP is ever read, logged, or stored.** Rate-limiting is a soft in-memory global cap + a soft
    API key (`CONFIG.API_KEY`), deliberately chosen over IP-based limiting to uphold anonymity.
  - Fires a Discord "new session" ping (anonymous summary only: quadrant, Brier, deck, pilot/live,
    running total — no identity).
- **Optional accounts (owner-facing convenience, separate system)** — `/api/register`, `/api/login`,
  `/api/me`, `/api/logout`, `/api/store/apophenia` (authed `PUT`/`GET`).
  - Reuses the Pi's existing same-origin auth server. Register is invite-gated.
  - Powers the **"★ Save to my history"** button + **My History dashboard** (Brier-trend sparkline,
    quadrant history, per-session list). Per-user storage.
  - **Only appears when `location.hostname === PI_HOST`** (same-origin). On the GitHub build it's
    invisible.

### 3.3 Privacy model (this is a hard constraint — "anonymity and privacy to be upheld")
- The **anonymous research pool carries no identifiers** — no names, emails, IPs, accounts. Just the
  pseudonymous per-browser `participantId` (localStorage token) + optional self-chosen codename, and
  the session payload. This preserves handoff invariant §7.6's *intent*.
- **Accounts are a deliberate, documented evolution of** — not a violation of — that invariant.
  Handoff invariant §7.6 was **amended 2026-07-05** to make this explicit: the research pool carries
  no identifiers; the account layer is a *strictly separate*, opt-in, same-origin-only feature for
  the owner's own dashboard. **Accounts never touch the research pool and add zero identity to
  research data.** The wall between the two systems is the invariant.
- **`pilot: true`** sessions are permanently excluded from any analysis pool. Checkbox stays on the
  intro screen.
- **Pre-IRB data is disposable** by owner's explicit decision.

---

## 4. What's done (milestones, newest first)

| Date | What | Commit |
|---|---|---|
| 2026-07-05 | Removed cinematic corner ticks site-wide (cosmetic; frees mobile corners) | `c0eaf27a` |
| 2026-07-04 | Removed the Esc/Home chrome hint from the app | `c6065b1d` |
| 2026-07-04 | **Optional accounts + personal My-History dashboard**; website link now works on all devices (Pi-served app + redirect) | `a1d8a325` |
| 2026-07-04 | Host-aware Contribute endpoint (on-tailnet support) | `7d076e06` |
| 2026-07-03 | **Project page + on-site paper** (`projects/apophenia-filter.html`, Aeropendulum-style), embedded PDF | `3f3772ec` |
| 2026-07-03 | **v0.4.1: binomial-test classifier** (one-sided exact binomial vs p=0.5 at α=0.05 for the "sensitive" gate); Quick deck relabeled **"practice"**; compass axes sourced from the classifier | `2340846c` |
| 2026-07-03 | Full pre-advertising **QA pass** — ceilings re-validated, scoring/classification/seed reproducibility cross-checked vs an independent reimplementation, deck/refresh/mobile all pass | `59e4c59b` |
| 2026-07-02 | 2×2 **compass** on the report (Sensitivity×Restraint), Brier clarity cues (green/coral, ✓/✗, "lower is better"), verdict cutoff aligned to 0.250 | `fbb76fc3` |
| 2026-07-01/02 | **Live deploy** as `project41`; **Cinematic reskin** (gold `#ffae20` + cyan `#7dd6ff`, Orbitron/Inter/Share Tech Mono, glass panels) as a JS-preserving CSS refactor; "got a D" line removed | `eccdd249` |
| — | Server keep-alive hardening + Discord down-alerts + new-submission pings | (Pi-side, not in git) |
| — | Population-analytics pipeline validated end-to-end vs a synthetic population | (test folder) |

**Deploy discipline:** every push to `origin/master` is done via a *throwaway git worktree cut from
origin/master* — never from the working tree. The local branch (`copilot-pa-default-chronography`)
carries hundreds of unrelated uncommitted WIP files, so worktree-isolation guarantees only the
Apophenia changes ship. Windows note: the worktree needs a **short path** (e.g. `/c/wt-...`) and
`git -c core.longpaths=true`, because `projects/manims/**` media paths overflow Windows MAX_PATH.

---

## 5. Resume-cold cheat sheet (secrets, ops, procedures)

**Source of truth for the app:** `Website/apophenia-filter/apophenia-filter.jsx` (VERSION `0.4.1`).
Live CONFIG: host-aware `CONTRIBUTE_ENDPOINT`, `API_KEY = "kuZSP54EQvK-HdU0qkB2wzQ3"`,
`PI_HOST = "peirastes-pi.tail6fdfc3.ts.net"`.

**Rebuild + redeploy the app (both copies):**
1. In `Website/apophenia-filter/`: `npm run build`, then **rename `dist/dev.html` → `dist/index.html`**
   (Vite emits `dev.html` because the input is `dev.html`).
2. `scp dist/index.html` (+ `assets/`) to `peirastes-pi:~/Server/public/apophenia/`.
3. Commit `dist/` to `origin/master` via a throwaway worktree (keeps GitHub fallback consistent).

**Pi access & ops:** `ssh peirastes-pi` (user `cole`). Node at `~/.local/node/bin/node` (v22, global
`fetch`). Server `~/Server/server.js` on `127.0.0.1:8787`, public via Tailscale Funnel. Supervised by
`@reboot` crontab + a `*/2` cron `monitor.sh` (health-checks `/api/health`, relaunches on failure via
`setsid --fork`, Discord alerts on state change). If the port is stuck: `pkill -f "node.*server\.js"`
then relaunch with `setsid --fork`. Server edits are done by scp'ing a `.cjs`/`.mjs` patch script
(idempotent + backup + `node --check`), never inline `node -e` (heredoc/emoji mangling).

**Secrets that are NOT in git:**
- **Discord webhook** → `~/Server/discord-webhook.txt` (chmod 600). Posts only to that one channel.
- **Account invite code** → `~/Server/config.json` `inviteCode = "XEPU-UB3B-VXXR-WZ4D"`.
- Owner's real account username: `cole` (test users were cleaned).
- CORS allow-list in `config.json`: peirastes.com (+ www), localhost:8000, `null`.

**Reading the collected data:** the anonymous JSONL is write-only over HTTP — pull it off the Pi
directly (`ssh`/`scp` from `~/Server/data/contrib-apophenia-filter.jsonl`) to analyze.

---

## 6. Population-analytics tooling (in this folder)

| File | Purpose |
|---|---|
| `analytics.mjs` | The population report: `node analytics.mjs <sessions.json \| dir>`. Excludes pilot, pools within a PARAMS_HASH. Outputs quadrant distribution, Brier/apophenia distributions, the class-wide sentinel check, per-mechanism×tier accuracy vs oracle ceiling, and a calibration/reliability curve. |
| `synth-population.mjs` | Generates a realistic synthetic population (`node synth-population.mjs [N=250]`), scored/classified EXACTLY as the app does, then runs `analytics.mjs`. **Proves the processing pipeline before any real data.** No real data / no IRB needed. |
| `tuning-harness.js` | Monte-Carlo oracle + practical-observer accuracy per mechanism×tier; reproduces v0.4, prints the 9 ceilings, asserts the shipped `CEILING` table (PASS). **Required for ANY generator/deck/scoring change** — never tune by feel; a change needs the harness + a new PARAMS_HASH. (The working rewrite lives here in the test folder; the copy referenced in the handoff manifest was the older broken one.) |

---

## 7. What's pending / candidate next steps

- **[gate 1] Friend pilot:** send 2–5 people the link, pilot flag ON, collect bug reports + first
  real sessions. Triage on real mobile devices.
- **[gate 2] IRB inquiry email** to UCO — draft is offered, not yet written. Minimal-risk framing.
- **Machine baselines for the paper (v0.5):** Kalman/particle filter + a small NN run through the
  identical protocol via the per-trial seeds, to sit beside human scores.
- **Longitudinal calibration curves:** now that accounts persist history, per-participant calibration
  over repeated sessions becomes analyzable (the whole "luck can't hold calibration across
  repetition" thesis, made visible).
- **v0.5 candidates (parked, do not build unprompted):** feedback-learning mode (per-trial mechanism
  reveal — can the "rules of chess" be learned?), adaptive/adversarial mechanism mode (reflexivity,
  Goodhart).

---

## 8. Governing docs & where things live

- **This doc** — current status / resume point.
- `apophenia-filter-handoff.md` — original v0.4.0 **design contract**; §2 (conceptual foundation),
  §5 (generative parameters), §6 (scoring), §7 (INVARIANTS) are still authoritative. Read §7 before
  changing anything methodological.
- `apophenia-filter-paper-draft.md` (+ `.pdf`) — the shareable paper (xelatex, Cambria/Consolas). The
  on-site readable version is `Website/projects/apophenia-filter.html`; public PDF at
  `Website/projects/apophenia-filter-paper.pdf`.
- `apophenia-filter-v0-4.jsx` — snapshot of the instrument at handoff time (the *live* source is
  `Website/apophenia-filter/apophenia-filter.jsx`, now v0.4.1).
- `SUPABASE_SETUP.md` — **superseded.** We chose the Pi over Supabase (no new accounts/passwords).
  Kept only as a record of the road not taken.

---

## 9. Where this doc supersedes the handoff (deltas since v0.4.0)

| Handoff says | Now (as-built) |
|---|---|
| §4/§6/§11 Backend = **Supabase** (INSERT-only RLS) | **Self-hosted Pi** append-only JSONL, no IP, soft key. Supabase abandoned. |
| §6 sensitive = structured accuracy **≥ 0.60**, ≥3 calls | **One-sided exact binomial vs p=0.5 at α=0.05** (`binomTailP(structK,structN) < 0.05`). ~30% → ~2% false-positive for a coin-flipper. |
| §7.6 originally "**No login**" | **Amended 2026-07-05** to "no identifiers *in the research pool*," explicitly permitting an **optional, isolated, owner-only account layer** for the personal dashboard — walled off from research data (§3.3). |
| §9 palette = ink/brass/cyan; **"He got a D"** line | **Cinematic tier** (gold/cyan, Orbitron/Inter). "Got a D" line **removed** per owner. |
| §9 Quick deck unlabeled | Quick deck relabeled **"practice"** (too few structured trials to prove skill). |
| Instrument version **v0.4.0** | **v0.4.1** (classifier change; generators/ceilings/Brier unchanged). |

---

*Standing reminders:* corner ticks are removed site-wide — don't re-add them. Never tune the
generators to any individual's performance (including the owner's) — harness + PARAMS_HASH only.
