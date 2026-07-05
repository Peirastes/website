# Data collection setup — Supabase (≈10 min)

> ⚠️ **SUPERSEDED — not the path we took.** Data collection now runs self-hosted on the Raspberry Pi
> (no new accounts/passwords, no IP stored). See `PROJECT_STATUS.md` §3.2. Kept only as a record of
> the road not taken.

The instrument's `contribute()` already POSTs the session payload to a REST endpoint
with an API key. We just need a table to receive it, locked down correctly. **Do this
whenever you want live collection; until then the pipeline is proven on synthetic +
pilot data (see `analytics.mjs` / `synth-population.mjs`).**

## The security model (read this first)
- The **anon key** ships **client-side and is public** — anyone can read it in the page source. That is fine *only* because Row-Level Security (RLS) restricts the anon role to **INSERT-only**: it can add sessions but cannot read, edit, or delete anything.
- The **service_role key** is **secret** — it bypasses RLS and is how *you* pull the data for analysis. It NEVER goes in the website. Keep it in a local env var only.

## Steps

**1. Create a project** at supabase.com (free tier). Note the project ref (the `xxxx` in `https://xxxx.supabase.co`).

**2. SQL editor → run:**
```sql
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  payload     jsonb not null
);
alter table public.sessions enable row level security;

-- anonymous web clients may INSERT only (the anon key is public)
create policy "anon insert only" on public.sessions
  for insert to anon with check (true);
-- no select/update/delete policy for anon  ->  those are all denied
```

**3. Settings → API — copy two values and send me:**
- **Project URL** → `https://<ref>.supabase.co`
- **anon public key** (the `anon` `public` one, a long JWT)

I will set, in the app:
```js
CONFIG.CONTRIBUTE_ENDPOINT = "https://<ref>.supabase.co/rest/v1/sessions";
CONFIG.API_KEY             = "<anon public key>";
```
then rebuild + redeploy. The app already sends `Prefer: return=minimal`, so INSERT needs **no** read policy.

**4. Keep the `service_role` key private** (Settings → API → `service_role`, `secret`). That's yours, for pulling data.

## Verifying the lockdown (I'll run these once wired)
- anon **INSERT** a test row → `201` ✓
- anon **SELECT** → returns `[]` (RLS hides all rows) ✓
- anon **DELETE / PATCH** → denied ✓

## Pulling data for analysis (with the secret service key, locally)
```bash
curl "https://<ref>.supabase.co/rest/v1/sessions?select=*" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" > sessions.json

node analytics.mjs sessions.json      # -> the population report
```
`analytics.mjs` accepts the raw Supabase rows (it unwraps each `payload`), excludes
pilot-flagged sessions automatically, and refuses to pool across different
`PARAMS_HASH` values (it warns if it sees more than one).

## During the pre-IRB dry run
Everyone testing checks the **Pilot session** box → those rows carry `pilot:true` and are
excluded from the analysis pool by `analytics.mjs`, so you can exercise the full
collect→pull→analyze loop on real inserts without contaminating any future study pool.
Flip to real collection only after the IRB determination.
