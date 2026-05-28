# How to Prompt Cursor Effectively (CheckMate)
# Read this once. Refer back whenever Cursor gives you bad output.

---

## The Golden Rule
**Come to Claude.ai first. Then take the output to Cursor.**

Bad workflow: vague idea → Cursor → confusion → bad code → confusion
Good workflow: vague idea → Claude.ai (plan it) → specific prompt → Cursor → working code

---

## Starting a New Cursor Session

Always paste the contents of CONTEXT.md at the top of your first Cursor message,
then replace the "Current Task" line with what you're building right now.

Example:
```
[paste entire CONTEXT.md here]

Current Task: I'm building the Supabase migration for the daily_challenges table.
The table needs: id, user_id, goal_id, date, trigger_fired_at, promise_time,
leeway_expires_at, posted_at, is_late (bool), streak_credited (bool).
Add RLS policies so users can only read/write their own rows.
```

---

## Prompt Templates by Task Type

### New API Route
```
Create a Next.js App Router API route at [path].
It should [what it does].
- Validate the request body with Zod (schema lives in packages/shared/schemas/)
- Authenticate using Supabase server client (@supabase/ssr createServerClient)
- Return { error, code } shape on errors
- Support cursor + limit pagination if it returns a list
Do not calculate streaks or leaderboards here — those are Inngest jobs.
```

### New Inngest Job
```
Create an Inngest function named [checkmate/job.name].
It should [what it does].
- Trigger: [cron schedule or event name]
- It reads from [tables] and writes to [tables]
- Handle errors by logging and NOT retrying more than 3 times
- This is the ONLY place [streak/leaderboard] logic should live
```

### New Screen (Mobile)
```
Create an Expo Router screen at apps/mobile/app/[path].tsx
It should show [what the user sees].
- Use NativeWind for styling
- Fetch data from [API endpoint]
- Show a loading skeleton while fetching
- Show an error state if the fetch fails
- Show an empty state if the data is empty: "[empty state message]"
- Use Zustand store at [store path] for [what state]
```

### New Screen (Web)
```
Create a Next.js Server Component at apps/web/app/[path]/page.tsx
It should show [what the user sees].
- Use Tailwind for styling
- Fetch data server-side using Supabase server client
- Pass data to a Client Component only if interactivity is needed
- Show loading state using Suspense + skeleton
- Show empty state if no data: "[empty state message]"
```

### Database Migration
```
Create a new Supabase migration file in supabase/migrations/.
Name it: [timestamp]_[description].sql
It should [what it does].
- Add RLS policies so users can only access their own rows
- Add indexes on [columns] for [reason]
- Do not modify existing columns — add new ones only
```

### Bug Fix
```
Here's the error I'm seeing:
[paste full error message]

Here's the relevant code:
[paste the file or function]

The expected behavior is: [what should happen]
The actual behavior is: [what's happening instead]

Please fix only the broken part. Don't refactor anything else.
```

---

## What to Do When Cursor Goes Off-Script

If Cursor starts doing something that doesn't match the rules in .cursorrules:

1. Stop it immediately (don't let it keep going)
2. Come to Claude.ai and paste what Cursor wrote + what went wrong
3. Get a corrected approach, then re-prompt Cursor with that

Common signs Cursor is off-script:
- It's calculating streaks inside an API route (should be Inngest)
- It's using getServerSideProps (should be App Router)
- It's using Redux (should be Zustand)
- It's writing raw SQL (should use Supabase client)
- It created a public photo URL (should be signed)

---

## Leaderboard Score Formula (Decide Before Week 7)
[ ] Pure streak count (simplest — recommended for v1)
[ ] Composite: streak × consistency_rate (posts / total_days)
[ ] Composite: streak × consistency × engagement (reactions + comments)

Pick one and add it here before building the leaderboard Inngest job.

---

## Useful Claude.ai Prompts for This Project

Before building a new feature:
"I'm about to build [feature] for CheckMate. Here's my plan: [describe it].
Does this match our data model and business rules? What could go wrong?"

When Cursor writes something you don't understand:
"Cursor wrote this code for CheckMate: [paste code].
Explain what it does in plain English. Does it follow our .cursorrules?"

When you hit an error you can't fix:
"I'm getting this error in CheckMate: [paste error + stack trace].
Here's the relevant code: [paste]. What's wrong and how do I fix it?"

When starting a new week of building:
"I'm starting Week [N] of building CheckMate. According to our build order,
I need to: [paste week's tasks]. What should I build first and what do I
need to set up before starting?"
