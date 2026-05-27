# Deploying GoalPost

GoalPost has three deployable pieces:

| Piece | Where it runs | You deploy it? |
|-------|----------------|----------------|
| **Database + Auth + Storage** | Supabase (already cloud) | Migrations only |
| **Web app + API + Inngest endpoint** | Vercel (recommended) | Yes |
| **Background jobs** | Inngest Cloud | Yes (sync app URL) |
| **Mobile app** | App Store / Play Store via EAS | Later |

---

## 1. Supabase (production)

Your project is already hosted at `https://nfpeasuabkwobyvocecc.supabase.co`.

1. Run all migration SQL files in **SQL Editor** if you haven’t (same as local).  
   **Required for messaging:** paste and run [`supabase/runbooks/apply_messaging.sql`](../supabase/runbooks/apply_messaging.sql)  
   ([open SQL Editor](https://supabase.com/dashboard/project/nfpeasuabkwobyvocecc/sql/new)).  
   Verify: `GET https://your-app.vercel.app/api/conversations/health` → `{ "ready": true }`.
2. **Authentication → URL Configuration** (replace with your real domain after Vercel deploy):

   | Setting | Example (production) |
   |---------|-------------------|
   | Site URL | `https://your-app.vercel.app` |
   | Redirect URLs | `https://your-app.vercel.app/auth/callback` |
   | | `https://your-app.vercel.app/**` |

3. **Google OAuth** (if used): In Google Cloud, keep redirect URI  
   `https://nfpeasuabkwobyvocecc.supabase.co/auth/v1/callback`  
   (unchanged — Google always talks to Supabase first).

4. **SMTP** (recommended for launch): Authentication → SMTP — avoids the ~2 emails/hour built-in limit.

5. **Storage**: Ensure the `post-images` bucket exists and policies match migrations.

---

## 2. Web app on Vercel

### One-time setup

1. Push the repo to GitHub: [github.com/dpark1719/GoalPost](https://github.com/dpark1719/GoalPost).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import **dpark1719/GoalPost**.
3. **Root Directory**: `apps/web`
4. Enable **“Include source files outside of the Root Directory”** (required for `@goalpost/shared` and `@goalpost/server`).
5. Framework: **Next.js** (auto-detected).

`apps/web/vercel.json` sets install/build to run from the monorepo root.

### Environment variables (Vercel → Project → Settings → Environment Variables)

Copy from `.env` and set for **Production** (and Preview if you want):

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as local |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server only |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` (no trailing slash) |
| `INNGEST_EVENT_KEY` | From Inngest dashboard (step 3) |
| `INNGEST_SIGNING_KEY` | From Inngest dashboard |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional |
| `UPSTASH_REDIS_REST_URL` | Optional |
| `UPSTASH_REDIS_REST_TOKEN` | Optional |

Do **not** commit `.env` to git.

6. Deploy. After the first deploy, set `NEXT_PUBLIC_APP_URL` to the real Vercel URL and **redeploy** if you used a placeholder.

7. Update **Supabase Auth** redirect URLs to match the Vercel URL (step 1 above).

### CLI alternative

```bash
npm i -g vercel
cd /path/to/P4
vercel link          # link to project, root = apps/web when prompted
vercel env pull apps/web/.env.local   # optional: pull env for local prod build
vercel --prod
```

### Verify production build locally

```bash
npm install
npm run build --workspace=@goalpost/web
cd apps/web && npm run start
```

---

## 3. Inngest (background jobs)

Daily challenges, streaks, leaderboards, and late-post marking run through Inngest.

1. Create an app at [app.inngest.com](https://app.inngest.com).
2. Copy **Event Key** and **Signing Key** into Vercel env vars.
3. In Inngest → **Apps** → your app → **Sync** / **Serve URL**:
   ```
   https://your-app.vercel.app/api/inngest
   ```
4. Deploy web again after keys are set. Inngest will discover functions from `inngest/functions`.

Local dev (unchanged):

```bash
npx inngest-cli@latest dev -u http://localhost:3001/api/inngest
```

---

## 4. Mobile app (Expo EAS)

The mobile app talks to **Supabase** directly and optionally to your **web API** for some routes.

### `apps/mobile/.env` (production)

```env
EXPO_PUBLIC_SUPABASE_URL=https://nfpeasuabkwobyvocecc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

### Supabase mobile auth redirects

Add to Supabase **Redirect URLs** (for deep links when you configure them):

- `goalpost://auth/callback` (example — match your `scheme` in `app.json`)

Update `app.json` `scheme` to something stable (e.g. `goalpost`) before store submission.

### Build with EAS

```bash
npm i -g eas-cli
cd apps/mobile
eas login
eas build:configure
eas build --platform ios
eas build --platform android
eas submit   # when ready for stores
```

Apple/Google sign-in for mobile need extra OAuth client IDs and redirect URIs in Supabase — same Google Cloud project, add iOS/Android client types as needed.

---

## 5. Custom domain (optional)

1. Vercel → Project → **Domains** → add `goalpost.com` (example).
2. Set `NEXT_PUBLIC_APP_URL=https://goalpost.com` and redeploy.
3. Update Supabase **Site URL** and **Redirect URLs** to the custom domain.
4. Update Inngest serve URL if you use a custom domain.

---

## Checklist before launch

- [ ] All Supabase migrations applied on production project
- [ ] `NEXT_PUBLIC_APP_URL` matches live URL
- [ ] Supabase redirect URLs include `/auth/callback`
- [ ] Google OAuth enabled + test sign-in on production URL
- [ ] Custom SMTP configured (if relying on email auth)
- [ ] Inngest synced to `https://<domain>/api/inngest`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in server env (Vercel), never in mobile
- [ ] Service role not exposed in `NEXT_PUBLIC_*` vars

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on Vercel | Enable “include files outside root”; check `apps/web/vercel.json` |
| Auth redirect error | Supabase redirect URL must match `NEXT_PUBLIC_APP_URL/auth/callback` |
| Google works locally but not prod | Add production URL to Supabase; consent screen test users |
| **Internal Server Error** on Google login | Fix: redeploy latest `auth/callback`; set `NEXT_PUBLIC_APP_URL` to Vercel URL; add `https://YOUR.vercel.app/auth/callback` in Supabase redirect URLs |
| Jobs never run | Inngest serve URL + `INNGEST_*` keys on Vercel |
| Email rate limit | Custom SMTP in Supabase |
