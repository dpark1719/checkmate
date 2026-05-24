# GoalPost

Cross-platform social accountability app — **Expo mobile** + **Next.js web** + **Supabase** + **Inngest**.

## Quick start

```bash
npm install
cp .env.example .env
# Fill Supabase + service role keys

# Run SQL migrations in Supabase SQL Editor:
# - supabase/migrations/20250523000000_initial_schema.sql
# - supabase/migrations/20250523000001_rls_fixes.sql
# - supabase/migrations/20250523000002_push_blocks_reports.sql

npm run dev:web
```

Mobile:

```bash
# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000

npm run dev:mobile
```

Inngest dev server:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

## Feature checklist (v1)

| Area | Status |
|------|--------|
| Auth (email, Google, Apple, phone OTP) | ✅ |
| Goals CRUD (max 5 active) | ✅ |
| Daily challenges + triggers | ✅ |
| Photo upload (private bucket) | ✅ |
| Posts + late/on-time logic | ✅ |
| Home + community feeds | ✅ |
| Follow, reactions, comments | ✅ |
| Streaks + leaderboards | ✅ |
| Public profiles `/u/[username]` | ✅ |
| Block + report | ✅ |
| GDPR account deletion | ✅ |
| Age gate onboarding | ✅ |
| Push tokens + Expo push on trigger | ✅ |
| Inngest (challenges, streaks, leaderboards, late mark) | ✅ |
| PostHog analytics hook | ✅ (set env key) |
| Mobile app (feed, post, discover, profile) | ✅ |

## Monorepo

```
apps/web/              Next.js UI + API
apps/mobile/           Expo app
packages/shared/       Zod + constants
packages/server/       Business logic (DB, feed, jobs)
inngest/               Background functions
supabase/migrations/
```

## Deploy

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for Vercel (web), Inngest (jobs), Supabase (auth URLs), and Expo EAS (mobile).

Repo: [github.com/dpark1719/GoalPost](https://github.com/dpark1719/GoalPost) — push code, then import `apps/web` on Vercel → set env vars → point Inngest at `https://<your-domain>/api/inngest` → update Supabase redirect URLs.

## Docs

- `docs/GOALPOST_PLAN.md` — product spec
- `docs/DEPLOYMENT.md` — production deploy guide
- `.cursorrules` — Cursor rules
- `CONTEXT.md` — paste into new chats
