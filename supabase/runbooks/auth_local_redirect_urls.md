# Local dev OAuth — stay on localhost

If Google sign-in sends you to **Vercel** instead of `http://localhost:3004`, Supabase is falling back to **Site URL** because localhost is not in **Redirect URLs**.

## Fix (one-time)

1. Open [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/nfpeasuabkwobyvocecc/auth/url-configuration).
2. Keep **Site URL** as your production URL (e.g. `https://your-app.vercel.app`).
3. Under **Redirect URLs**, add (do not remove production URLs):

```
http://localhost:3004/auth/callback
http://localhost:3004/**
http://127.0.0.1:3004/auth/callback
http://127.0.0.1:3004/**
```

4. Save. Sign in again from `http://localhost:3004/login`.

The app sends `redirectTo` as your current browser origin (`window.location.origin`); Supabase only honors it when the URL is allowlisted.
