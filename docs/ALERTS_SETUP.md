# Email + SMS alerts setup

## Email alerts (comments + DMs)

Already implemented in code. Configure production:

### Resend

1. [resend.com](https://resend.com) → add domain `lockinatcheckmate.app`
2. Add DNS records Resend provides (can live in Cloudflare alongside Vercel)
3. Create API key

### Vercel env (Production)

```
RESEND_API_KEY=re_...
EMAIL_FROM=CheckMate <alerts@lockinatcheckmate.app>
```

Redeploy after setting vars.

### Test

- User A comments on User B's post → B gets email (if `emailComments` on in Profile → Settings)
- User A DMs User B → B gets email (if `emailMessages` on)

---

## Phone login (OTP)

### Supabase

1. Authentication → Providers → **Phone** → Enable
2. SMS provider: **Twilio**
3. Enter Twilio Account SID, Auth Token, and Message Service SID (or From number)

### Twilio

1. Create account at [twilio.com](https://www.twilio.com)
2. Buy a phone number or create a Messaging Service
3. Use same credentials in Supabase (OTP) and Vercel (daily trigger SMS below)

### Test

- `/login` → enter phone → receive OTP → verify → land on feed/onboarding

---

## SMS daily check-in triggers

Separate from OTP: app sends accountability texts via Twilio REST API when `fireDueTriggers` runs.

### Vercel env (Production)

```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG...   # preferred
# or TWILIO_FROM_NUMBER=+1...
CRON_SECRET=<random-long-string>     # Vercel Cron auth
```

`CRON_SECRET` is sent automatically by Vercel Cron as `Authorization: Bearer <CRON_SECRET>`.

### Scheduler

Vercel Cron hits `/api/cron/fire-triggers` once daily (see `apps/web/vercel.json`). **Hobby plans only allow one cron run per day** — hourly schedules block deploys.

For hourly trigger coverage on Hobby, use an external cron (e.g. [cron-job.org](https://cron-job.org)) to `GET` your production URL with header `Authorization: Bearer <CRON_SECRET>`.

Without `CRON_SECRET`, cron returns 503. Without Twilio env, SMS is skipped (logged in dev).

### User prefs

Profile → Settings → **Daily check-in text messages** (only shown for phone sign-in accounts). Default: on.
