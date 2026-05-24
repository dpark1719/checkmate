# GoalPost — Cursor Context File
# Paste this into Cursor chat when starting a new session or switching to a new feature area.

## What I'm Building
GoalPost: a cross-platform social accountability app (Next.js web + Expo mobile).
Users set goals, get a daily randomized notification in their 5am–10pm local window,
set a "promise time" to post a photo, and share progress with followers + goal communities.

## My Stack
- Mobile: Expo (React Native) with Expo Router
- Web: Next.js 14 App Router + Tailwind CSS
- DB + Auth + Storage: Supabase
- Background jobs: Inngest
- Caching: Upstash Redis
- Push notifications: Expo Push Notifications
- Validation: Zod (shared package)
- State: Zustand
- Error tracking: Sentry
- Analytics: PostHog

## Monorepo Layout
```
goalpost/
├── apps/mobile/        # Expo app
├── apps/web/           # Next.js app (API routes + web UI)
├── packages/shared/    # Shared types + Zod schemas
├── packages/ui/        # Shared components
├── supabase/migrations/
└── inngest/
```

## The 3 Rules Cursor Must Never Break
1. Streak math is ALWAYS an Inngest job (server-side, midnight local). Never in a route or component.
2. Max 5 active goals per user — enforce at API level.
3. All photo URLs are signed (private Supabase bucket). Never expose public URLs.

## Current Task
v1 feature-complete in repo. Connect Supabase + run migrations + deploy web to Vercel + EAS build for mobile.

## Agent workflow
After code changes: commit → `git push origin main` → Vercel auto-redeploys (~1–2 min). Rule: `.cursor/rules/git-commit-deploy.mdc`.
