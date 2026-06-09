# CheckMate

Cross-platform social accountability app — **Expo mobile** + **Next.js web** + **Supabase** + **Inngest**.

Local clone folder: **`CheckMate`** (recommended; was `P4`).

## Quick start

```bash
npm install
cp .env.example .env
# Fill Supabase + service role keys

# Run SQL migrations in Supabase SQL Editor (in order):
# - supabase/migrations/20250523000000_initial_schema.sql
# - supabase/migrations/20250523000001_rls_fixes.sql
# - supabase/migrations/20250523000002_push_blocks_reports.sql
# - supabase/migrations/20250523100000_profile_bio.sql
# - supabase/migrations/20250523110000_community_shared_goal.sql
# - supabase/migrations/20250523120000_community_member_count_trigger.sql
# - supabase/migrations/20250523130000_reaction_cheers.sql
# - supabase/migrations/20250523140000_social_links_and_messages.sql
# - supabase/migrations/20250524100000_user_notifications.sql
# - supabase/migrations/20250524110000_posts_soft_delete_rls.sql
# - supabase/migrations/20250524120000_avatars_bucket.sql  ← required for profile photos
# - supabase/migrations/20250602120000_message_requests.sql  ← required for DMs + message requests
# - supabase/migrations/20250604120000_dedupe_dm_conversations.sql  ← merges duplicate threads (same user + post); inbox hides dupes
# - supabase/migrations/20250605120000_goal_completion.sql  ← completable goals with target dates + before/after

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

Repo: [github.com/dpark1719/CheckMate](https://github.com/dpark1719/CheckMate) — push code, then import `apps/web` on Vercel → set env vars → point Inngest at `https://<your-domain>/api/inngest` → update Supabase redirect URLs.

## Docs

- `docs/CHECKMATE_PLAN.md` — product spec
- `docs/DEPLOYMENT.md` — production deploy guide
- `docs/ALERTS_SETUP.md` — email alerts, phone login, SMS triggers
- `.cursorrules` — Cursor rules
- `CONTEXT.md` — paste into new chats
