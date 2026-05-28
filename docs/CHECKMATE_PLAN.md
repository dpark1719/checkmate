# CheckMate — App Planning Document
### Cross-Platform Social Productivity App | v1 Blueprint

> **One-sentence pitch:** CheckMate is a social app for general consumers that gives every person — regardless of what they're working toward — a daily trigger to document and share their goal progress, combining BeReal's accountability mechanic with Strava's community momentum, for any goal in life.

---

## 1. The Problem & Why Now

Every existing social or productivity app is goal-type-specific:
- **Strava / Nike Run Club** → runners only
- **MyFitnessPal** → dieters only
- **LinkedIn** → professional goals only
- **BeReal** → no goal context at all, just presence

No app captures the full human experience of *working toward something* — regardless of what that thing is. CheckMate fills this gap.

**Why people would pick it over doing nothing / a spreadsheet:**
A spreadsheet has no social layer. No one cheers you on. No one holds you accountable. CheckMate makes daily progress feel like participation in something bigger, while keeping the bar low (one photo, once a day).

---

## 2. V1 Scope — "Done" Definition

**Ship exactly this. Nothing more.**

### Journey 1: Onboarding & First Goal
**Trigger:** User downloads app or visits web app for the first time.
**Success:** User creates an account, sets at least one goal with a category and description, sets a promise time for that goal, and sees their personal feed.
**Failure modes:**
- Social login fails → fall back to email/phone
- User skips goal setup → prompt again on next open, not a blocker
- User skips promise time → assign a default (8:00 PM local) with a note they can change it
- Duplicate account (same email via different auth method) → merge or surface clear error

---

### Journey 2: Daily Trigger → Promise → Post
**Trigger:** Randomized daily trigger fires within user's local 5am–10pm window.
**Success:** User sees trigger, sets or confirms promise time, posts a photo within the promised window + 1-hour leeway. Streak increments. Post appears in followers' and community feeds.
**Failure modes:**
- Notification permission denied → in-app banner reminder
- User misses promise window + leeway → streak resets, posting still allowed but marked "late"
- No promise time set → treat trigger expiry (10pm local) as deadline
- Photo upload fails → queue and retry, show pending state
- No goals set → prompt to create one before posting

---

### Journey 3: Social Feed & Reactions
**Trigger:** User opens app to browse.
**Success:** User sees feed from followed users AND goal communities, can react and comment.
**Failure modes:**
- Empty feed → surface goal community feed as default
- Offline → show cached feed with indicator
- Toxic comment → report flow (manual review in v1)

---

### Journey 4: Goal Community Discovery
**Trigger:** User wants to find others with the same goal type.
**Success:** User browses/searches categories, joins a community, sees others' posts.
**Failure modes:**
- No search results → suggest closest category
- Empty community → empty state with invite prompt

---

### Journey 5: Streak & Leaderboard
**Trigger:** User checks progress or hits a milestone.
**Success:** User sees streak per goal, their rank on weekly and all-time leaderboards (global and regional tabs), and can share streak as a post.
**Failure modes:**
- Streak broken → clear explanation of which window was missed
- Fewer than 3 users in community → don't show leaderboard
- Fewer than 3 regional users → fall back to global only

---

### Journey 6: Follow Another User
**Trigger:** User sees a post they like.
**Success:** User visits profile, follows, and their future posts appear in the feed.
**Failure modes:**
- Block/report available from profile
- All accounts public by default in v1 (privacy settings in v2)

---

### Journey 7: Profile & Goal Progress View
**Trigger:** User or visitor views a profile.
**Success:** Profile shows active goals, post grid, current streaks, and leaderboard rank.
**Failure modes:**
- No posts yet → show goals with empty grid
- Archived goal → posts preserved but goal hidden from public profile

---

## 3. Daily Trigger System

This is the most technically nuanced part of the app. Get this right before building anything else.

### Phase 1 — V1: Randomized Local Window
- Each user gets a trigger fired at a **random time between 5:00 AM and 10:00 PM in their local timezone**, every day
- Randomized per user per day (not the same time daily) to prevent habituation
- Randomization is server-side: calculated at midnight local time and enqueued via job scheduler

### Phase 2 — V2: Adaptive Timing
- After enough post history accumulates, the system analyzes when each user actually uploads
- The trigger window narrows toward their observed peak engagement time
- Users can see their "predicted best time" as a stat on their profile

### Promise Time (User Commitment Layer)
- After receiving the daily trigger, users can set a **Promise Time** — the specific time they commit to posting that day
- Promise Time must be set within **2 hours of receiving the trigger**
- If no Promise Time is set, 10:00 PM local acts as the hard deadline
- **1-Hour Leeway:** Users have 1 hour past their Promise Time before streak breaks
  - Example: Promise = 6:00 PM → post by 7:00 PM → miss 7:00 PM → streak resets
- After leeway closes, posting is still allowed but marked **"Late"** — no streak credit, no leaderboard points
- Promise Time is per-goal, per-day (multiple goals can have different promise times)

### Why This Is Better Than BeReal
BeReal's mechanic is random and anxiety-inducing. CheckMate gives users **agency through commitment**: you choose when you'll do the thing, which mirrors the actual psychology of goal-setting. The leeway window handles real life without removing consequences.

### Technical Notes
- Use Inngest (or Supabase Edge Functions + pg_cron) to schedule per-user daily trigger notifications
- Store user timezone at signup (device-detected, user-adjustable)
- Store `trigger_time`, `promise_time`, `leeway_expires_at`, `posted_at` in a `DailyChallenge` table
- **Streak logic runs server-side only at midnight local time — never trust the client for streak math**

---

## 4. Data Model

### Core Entities

```
User
├── id (uuid)
├── display_name
├── username (unique)
├── avatar_url
├── timezone (e.g. "America/Chicago")
├── region (country code, for regional leaderboards)
├── auth_methods[] (email, phone, google, apple)
├── created_at
└── notification_preferences{}

Goal
├── id (uuid)
├── user_id (FK → User)
├── title
├── category (enum: fitness, diet, career, study, finance, relationship, creative, other)
├── description
├── default_promise_time (time — user's preferred posting time for this goal)
├── is_active (bool)
├── created_at
└── archived_at

DailyChallenge           ← one row per user per goal per day
├── id (uuid)
├── user_id (FK → User)
├── goal_id (FK → Goal)
├── date (date)
├── trigger_fired_at (timestamptz)
├── promise_time (timestamptz — null if not set)
├── leeway_expires_at (timestamptz — promise_time + 1 hour)
├── posted_at (timestamptz — null if not posted)
├── is_late (bool)
└── streak_credited (bool)

Post
├── id (uuid)
├── user_id (FK → User)
├── goal_id (FK → Goal)
├── daily_challenge_id (FK → DailyChallenge)
├── photo_url
├── caption
├── is_late (bool)
├── created_at
└── deleted_at

Reaction
├── id, post_id, user_id
├── type (enum: fire, clap, heart, mind_blown)
└── created_at

Comment
├── id, post_id, user_id
├── body, created_at, deleted_at

Follow
├── follower_id, following_id, created_at

GoalCommunity
├── id, category, member_count (denormalized), created_at

CommunityMembership
├── user_id, community_id, joined_at

Streak
├── id, user_id, goal_id
├── current_count, longest_count, last_credited_date

Leaderboard              ← denormalized, recalculated hourly
├── id, user_id, goal_id, category
├── region (country code — null = global)
├── period (enum: weekly, all_time)
├── week_start (date — null for all_time)
├── streak_count, post_count, score
└── updated_at

SponsorReward            ← V3, defined now to avoid schema rework later
├── id, sponsor_name, category
├── region (null = global)
├── period (weekly / monthly)
├── rank (1, 2, 3)
├── prize_description, prize_value_usd
├── active_from, active_to
└── claimed_by_user_id (FK → User, null until claimed)

AdImpression
├── id, user_id, goal_category, ad_unit_id, shown_at, clicked (bool)
```

### Storage
- **Database:** PostgreSQL via Supabase
- **Media:** Supabase Storage → Cloudflare R2 at scale
- **Caching:** Feed data and leaderboards → Upstash Redis
- **On-device:** Auth token, cached feed (last 20 posts), timezone, notification prefs only

---

## 5. Auth & Permissions

### Auth Methods (V1)
- Email magic link (preferred over password)
- Google OAuth
- Apple Sign In (**required** by App Store if any other social login exists)
- Phone number SMS OTP (Twilio or Firebase Auth)

**Deferred to V2:** KakaoTalk, WeChat, WhatsApp — require regional business agreements.

### Permissions
| Permission | V1? | When to Ask |
|---|---|---|
| Push Notifications | Yes | After first goal created |
| Camera | Yes | On first "Post" tap |
| Photo Library | Yes | On first "Post" tap |
| Location | No | Defer — use IP/device for timezone |
| Contacts | No | Defer to v2 |

---

## 6. Screen Flow (V1)

```
[Splash]
    │
    ▼
[Onboarding]
  Sign up → Create first goal → Set promise time → Enable notifications
    │
    ▼
[Main App — Tab Bar]
  ├── Home Feed
  │     ├── Posts from followed users + goal communities
  │     └── Empty state → prompt to discover communities
  │
  ├── Discover
  │     ├── Browse goal categories
  │     ├── Search
  │     └── Community feed by category
  │
  ├── [+] Post (center CTA)
  │     ├── Today's trigger time + promise time status
  │     ├── Set / confirm promise time
  │     ├── Camera or photo library
  │     ├── Tag goal(s)
  │     ├── Optional caption
  │     └── Post → streak animation
  │
  ├── Streaks / Leaderboard
  │     ├── My streaks per goal (current + longest)
  │     ├── Weekly leaderboard → [Global] [Regional] tabs
  │     └── All-time leaderboard → [Global] [Regional] tabs
  │
  └── Profile
        ├── Active goals + streak counts
        ├── Post grid (reverse chrono)
        ├── Leaderboard rank badges
        ├── Followers / Following
        └── Settings
              ├── Notification & promise time prefs
              ├── Timezone (auto-detected, adjustable)
              ├── Auth / account
              ├── Privacy & data
              └── Log out
```

---

## 7. Platform Strategy

**Stack: Expo (React Native) + Next.js + Supabase + Inngest**

| Layer | Tech | Rationale |
|---|---|---|
| Mobile | Expo / React Native | One codebase → iOS + Android |
| Web | Next.js App Router | Shares business logic via monorepo |
| Backend / DB | Supabase | Auth + Postgres + Storage + Realtime |
| Job scheduling | Inngest | Trigger scheduling, streak calc, leaderboard refresh |
| Caching | Upstash Redis | Serverless, pay-per-request |
| Push notifications | Expo Push → APNs / FCM | Abstracts platform differences |
| Hosting | Vercel | Zero-config Next.js |
| Monorepo | Turborepo | Shared types and validation across web + mobile |

**V1 assumption:** Supabase + Inngest handles everything. No separate backend until MAU > 10k.

**Offline:** No offline posting in V1. Clear banner when offline. Cache last feed for reading only.

**Release:** Web ships first (no review gate). Mobile targets TestFlight + internal Android track by week 8.

---

## 8. Non-Functional Requirements

### Performance
- Feed loads < 1.5s on 4G
- Photo upload < 5s for 5MB with progress bar
- Trigger notifications within 60s of scheduled time
- Leaderboard recalculated hourly (not real-time in v1)
- Promise time countdown updates in real time in-app

### Security & Privacy
- HTTPS/TLS everywhere
- Photos served via signed URLs (not public bucket)
- Goal-intent data anonymized and aggregated for ads — never sold as individual profiles
- PII encrypted at rest via Supabase
- GDPR (EU) + CCPA (CA): consent banner and data deletion endpoint required at launch
- Age gate: 13+ globally, 16+ for GDPR regions
- No ad targeting for under-18 accounts

### Analytics (V1)
**Measure:** DAU, DAU/MAU, trigger→promise set rate, promise→post rate, late post rate, streak distribution, goal category split, D1/D7/D30 retention.

**Do not collect:** Precise location, contacts, device IDs beyond push token.

**Tool:** PostHog (GDPR-friendly, has Expo SDK)

### Ad & Sponsor Strategy

**V1:** No ads. Collect engagement and goal-category data only.

**V2 — Contextual ads by goal category:**
| Category | Ad Verticals |
|---|---|
| Fitness | Activewear, Fitbit, Oura Ring, supplements |
| Diet | Meal kits, nutrition apps |
| Finance | Savings apps, investment platforms |
| Career | Course platforms, resume tools |
| Study | Tutoring, stationery, productivity tools |
| Creative | Art supplies, courses, equipment |

**V3 — Sponsor Leaderboard Rewards:**
- Top 3 per category per period win physical prizes from sponsors
- Periods: **weekly** (resets Monday) + **all-time** (never resets), shown side-by-side
- Scope: **global** + **regional** (by country), tabbed in UI
- Example (Fitness, weekly, global): 🥇 Fitbit · 🥈 Oura Ring · 🥉 Owala bottle
- Prize fulfillment: manual early (secure address collection form); automate at scale
- Anti-cheat: flag abnormal streaks before awarding — required before any sponsor goes live
- Requires internal sponsor admin tool (not user-facing)

### Support (V1)
- In-app "Report a problem" → email inbox (Formspree)
- Crash reporting: Sentry (Expo SDK, free tier)
- No live chat in V1

---

## 9. API Shape (Key Endpoints)

```
AUTH
POST   /auth/signup
POST   /auth/login
POST   /auth/logout

USERS
GET    /users/:username
PATCH  /users/me            { display_name?, avatar_url?, timezone?, notification_prefs? }
GET    /users/me/feed        → Post[] (paginated)

GOALS
GET    /goals
POST   /goals               { title, category, description, default_promise_time? }
PATCH  /goals/:id
DELETE /goals/:id

DAILY CHALLENGES
GET    /challenges/today     → DailyChallenge[] (one per active goal)
PATCH  /challenges/:id       { promise_time }
GET    /challenges/history   → DailyChallenge[] (paginated)

POSTS
POST   /posts               { goal_id, daily_challenge_id, photo_url, caption? }
GET    /posts/:id
DELETE /posts/:id
GET    /users/:id/posts     → Post[]

SOCIAL
POST   /follows             { following_id }
DELETE /follows/:following_id
GET    /users/:id/followers / /following

REACTIONS
POST   /posts/:id/reactions { type }
DELETE /posts/:id/reactions/:type

COMMENTS
POST   /posts/:id/comments  { body }
DELETE /comments/:id

COMMUNITIES
GET    /communities
GET    /communities/:category/feed       → Post[]
POST   /communities/:category/join
DELETE /communities/:category/leave

STREAKS & LEADERBOARDS
GET    /streaks/me
GET    /leaderboards/:category?period=weekly&scope=global
GET    /leaderboards/:category?period=weekly&scope=regional
GET    /leaderboards/:category?period=all_time&scope=global
GET    /leaderboards/:category?period=all_time&scope=regional
```

All list endpoints: `cursor` + `limit` pagination. All responses: camelCase JSON.

---

## 10. Build Order (Vertical Slices)

**Week 1–2: Auth + Core DB**
- [ ] Supabase project, DB schema migrated (including DailyChallenge)
- [ ] Auth: Google, Apple, email magic link, phone OTP
- [ ] Timezone detection on signup (device-detected, adjustable)
- [ ] User profile creation on first login

**Week 3–4: Goal + Daily Challenge + Post**
- [ ] Goal CRUD with default_promise_time
- [ ] DailyChallenge rows auto-created at midnight per user per active goal (Inngest)
- [ ] Trigger notification scheduled randomly within 5am–10pm local window
- [ ] Promise time set/update
- [ ] Photo upload → Supabase Storage → Post created
- [ ] is_late and streak_credited logic (server-side, runs at leeway expiry)

**Week 5–6: Feed + Social**
- [ ] Following feed
- [ ] Goal community feed by category
- [ ] Reactions + comments
- [ ] Follow / unfollow

**Week 7: Streaks + Leaderboards**
- [ ] Streak calculation job (midnight local, server-side only)
- [ ] Leaderboard recalc job (hourly)
- [ ] Weekly reset job (Monday midnight UTC)
- [ ] Global + regional endpoints, both periods

**Week 8: Polish + Release Prep**
- [ ] All empty states
- [ ] Promise time countdown UI (real-time)
- [ ] Full error handling on API calls
- [ ] Sentry + PostHog integrated
- [ ] App Store / Play Store assets
- [ ] TestFlight + internal Android build

---

## 11. Acceptance Tests (Plain English)

### Onboarding
- [ ] Sign up with Google in under 60 seconds
- [ ] Sign up with Apple ID on iPhone
- [ ] Sign up via email magic link (link received, tap logs in)
- [ ] Sign up with phone OTP
- [ ] Prompted to create goal and set promise time after signup
- [ ] Skipping promise time assigns default and shows a note
- [ ] Skipping goal setup shows empty feed, not a crash

### Daily Trigger & Promise
- [ ] Trigger fires within user's 5am–10pm local window
- [ ] Trigger does NOT fire between 10pm–5am local
- [ ] Promise time can be set within 2 hours of trigger
- [ ] Countdown to leeway expiry visible on post screen
- [ ] Posting before leeway expiry → streak increments, streak_credited = true
- [ ] Posting after leeway expiry → post marked "late", no streak credit
- [ ] Streak resets to 0 the morning after a fully missed day
- [ ] User can still post after missing — shown as "late"

### Feed & Social
- [ ] Following feed shows only followed users' posts
- [ ] Community feed correctly filters by goal category
- [ ] Reactions update immediately (optimistic UI)
- [ ] Following a user → their posts appear on next feed load

### Streaks & Leaderboard
- [ ] Weekly leaderboard resets every Monday
- [ ] All-time leaderboard never resets
- [ ] Global and regional tabs both visible
- [ ] Regional falls back to global if fewer than 3 regional users
- [ ] Leaderboard hidden if community has fewer than 3 members

### Profile
- [ ] Shows active goals with streak counts
- [ ] Post grid in reverse chronological order
- [ ] Archiving goal removes it from public profile, posts preserved

---

## 12. V1 Release Plan

| Step | Detail |
|---|---|
| Internal testing | Week 8: TestFlight + Play internal track + Vercel preview |
| Crash reporting | Sentry — alert on crash rate > 1% |
| Soft launch | Invite-only, 50–100 users, one goal category, one timezone region |
| Feedback | In-app "Report a problem" + private Discord for early users |
| Rollback | Daily Supabase snapshots, Vercel instant rollback, pull mobile build if critical |
| Public launch | Staged: 10% → 50% → 100% over 2 weeks |

---

## 13. Known Risks & Deferred Decisions

| Risk | Mitigation |
|---|---|
| Per-user trigger scheduling at scale | Inngest handles fan-out; evaluate dedicated cron infra at 100k+ users |
| Streak inconsistency across timezones | Streak logic server-side only, never trust client clock |
| Multiple goals = multiple daily notifications | Cap at 5 active goals in v1 to limit notification overload |
| Feed fan-out at scale | Query-based feed in v1; migrate to push fan-out at 10k+ DAU |
| Leaderboard gaming before prizes go live | Flag abnormal patterns before any sponsor reward is activated |
| Sponsor prize fulfillment operations | Manual early; requires admin tool and automation before V3 scale |
| International auth (KakaoTalk, WeChat) | Deferred to V2 — regional business agreements required |
| GDPR / CCPA | Consent banner + deletion endpoint before EU/CA launch |
| Minors on platform | Age gate at onboarding; no ad targeting under-18 |
| Content moderation | V1: manual review. V2: automated (AWS Rekognition or equivalent) |

---

## 14. Open Questions to Resolve Before Building

1. **App name finalized?** "CheckMate" is placeholder.
2. **Goal categories fixed in v1?** Recommended fixed list: Fitness, Diet, Finance, Career, Study, Relationship, Creative, Other.
3. **Max active goals per user?** Recommend capping at 5 to limit notification load.
4. **Promise time set window?** Currently 2 hours after trigger — confirm this feels right.
5. **Leaderboard score formula?** Pure streak count, or composite (streak × consistency × engagement)? Decide before Week 7.
6. **Public profiles by default?** Recommended yes for v1; privacy toggle in v2.
7. **Web-first or mobile-first?** Strongly recommend web first — no App Store delay.

---

## 15. Product Roadmap (Beyond V1)

| Version | Focus |
|---|---|
| **V1** | Core loop: trigger → promise → post → streak → social feed |
| **V2** | Adaptive trigger timing, privacy settings, find friends via contacts, contextual ads, international auth |
| **V3** | Sponsor leaderboard rewards, prize fulfillment, anti-cheat layer, sponsor admin tool |
| **V4+** | AI goal coaching, completion certificates, brand partnership marketplace |

---

*Last updated: planning phase — pre-build*
*Version: 1.1 — updated trigger system, promise time mechanic, leaderboard structure, sponsor roadmap*
