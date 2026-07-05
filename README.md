# Review Reply Assistant v2

A clean, standalone MVP for managing **Google Business Profile** review replies.

This is a phased rebuild. The guiding rule: **prove the real Google connection
works before building any dashboard.** No demo data in real mode, no silent
fallbacks, no raw JSON errors in the browser.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS v3 · Supabase (Auth + DB) · Vercel
- **Standalone:** not connected to MasOrder or MasBooks.

---

## Phase status

| Phase | Scope | Status |
|------:|-------|--------|
| 0 | Fresh project setup + `/health` | ✅ done |
| 1 | Deploy to Vercel (GitHub path) | ✅ **current** |
| 2 | Supabase magic-link login | ⬜ |
| 3 | Google OAuth connection | ⬜ |
| 4 | Verify Business Profile API access | ⬜ |
| 5 | Real accounts & locations | ⬜ |
| 6 | Real reviews sync | ⬜ |
| 7 | AI reply drafts | ⬜ |
| 8 | Manual post reply to Google | ⬜ |
| 9 | UI polish | ⬜ |

---

## Run locally

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.local.example .env.local
#   (Windows PowerShell: Copy-Item .env.local.example .env.local)
#   Phase 0 needs no real values — /health simply reports "no" for each.

# 3. Start the dev server
npm run dev
```

Then open:

- App:    http://localhost:3000
- Health: http://localhost:3000/health

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the local dev server on port 3000 |
| `npm run build` | Production build |
| `npm run lint` | Lint with ESLint (`next lint`) |

---

## Deploy to Vercel (GitHub path — recommended)

This is the **stable-URL-first** path. We deploy before wiring Google OAuth so
the redirect URI never changes.

### 1. Create the GitHub repo and push
The local repo is already initialized and committed. Create an **empty** repo on
GitHub named `review-reply-assistant-v2` (no README/license), then:

```bash
cd C:\Users\Ibrahem\Desktop\review-reply-assistant-v2
git remote add origin https://github.com/<your-username>/review-reply-assistant-v2.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel
1. https://vercel.com → **Add New… → Project → Import Git Repository**.
2. Pick `review-reply-assistant-v2`.
3. Framework preset: **Next.js** (auto-detected). Leave build/output settings default.
4. **Do not** add env vars yet — Phase 1 deploys with none. Click **Deploy**.

### 3. Get your stable URL
After the first deploy Vercel gives you a production URL, e.g.
`https://review-reply-assistant-v2.vercel.app`. Note the **exact** value — it
drives the Google redirect URI in Phase 3.

### 4. Lock in the app base URL
In Vercel → **Settings → Environment Variables**, add (Production + Preview):

```
NEXT_PUBLIC_APP_URL = https://<your-exact-vercel-url>
```

Then **Redeploy** (Deployments → ⋯ → Redeploy) so it takes effect.

### 5. Verify the live deploy
Open `https://<your-vercel-url>/health`. It should show:
- **App running: yes**
- **Hosting: Vercel · production**
- **App base URL:** your Vercel URL
- All Supabase/Google vars still **no** (expected until later phases)

> If the project name is taken and Vercel assigns a different URL, that's fine —
> just use whatever URL Vercel gives you consistently for `NEXT_PUBLIC_APP_URL`
> and the Phase 3 `GOOGLE_REDIRECT_URI`.

---

## Environment variables

Copy `.env.local.example` → `.env.local` for local dev, and mirror the same keys
in Vercel for production. **Phase 0 requires none of these** — `/health` will
simply report `no` until they are set in later phases.

| Variable | Public? | Introduced | Purpose |
|----------|:------:|:----------:|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Phase 2 | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Phase 2 | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Phase 3 | Server-only, bypasses RLS for token storage |
| `GOOGLE_CLIENT_ID` | no | Phase 3 | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | no | Phase 3 | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | no | Phase 3 | Must exactly match a URI registered in Google Cloud |
| `TOKEN_ENCRYPTION_KEY` | no | Phase 3 | 32-byte base64 key to encrypt tokens at rest |
| `NEXT_PUBLIC_APP_URL` | yes | Phase 1 | Absolute base URL for building redirects |

Only variables prefixed `NEXT_PUBLIC_` are exposed to the browser. Everything
else stays server-side.

---

## Database

The initial schema lives at [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
Run it in the Supabase SQL Editor (or via `supabase db push`) starting in
Phase 2. Every table is scoped by `user_id` with Row Level Security enabled.

---

## Principles (do not violate)

1. No demo data unless an explicitly separated **Demo Mode** is enabled.
2. No fake reviews in real mode. No silent fallback to demo data.
3. No raw JSON errors surfaced to the browser — always a friendly message.
4. Tailwind must stay working; no plain-HTML fallback.
5. Official Google Business Profile APIs + OAuth only. No scraping, no password storage.
6. Manual approval required before any reply is posted.
