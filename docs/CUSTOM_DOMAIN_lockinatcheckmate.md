# Custom domain: lockinatcheckmate.app

**Symptom:** Safari “Can’t Find the Server” — DNS has no A/CNAME records yet (only Cloudflare nameservers).

**Vercel `*.vercel.app` works** — fix is DNS + Vercel domain attachment only. Inngest is optional and unrelated.

---

## 1. Add domain in Vercel

1. [vercel.com](https://vercel.com) → **CheckMate** project → **Settings → Domains**
2. Add **`lockinatcheckmate.app`**
3. Add **`www.lockinatcheckmate.app`** (recommended)
4. Set **`lockinatcheckmate.app`** as primary; redirect `www` → apex (or vice versa)

Vercel will show required DNS records. Use the values below if they match.

---

## 2. Cloudflare DNS (your nameservers are already Cloudflare)

[Cloudflare Dashboard](https://dash.cloudflare.com) → **lockinatcheckmate.app** → **DNS** → **Records**

Add:

| Type  | Name | Content              | Proxy status |
|-------|------|----------------------|--------------|
| **A** | `@`  | `76.76.21.21`        | **DNS only** (grey cloud) |
| **CNAME** | `www` | `cname.vercel-dns.com` | **DNS only** (grey cloud) |

Delete any conflicting `A` / `CNAME` on `@` or `www` (parking pages, old hosts).

**Important:** For first setup with Vercel, use **DNS only** (grey cloud). Orange-cloud proxy can cause SSL/cert issues until the domain is verified.

Wait 5–30 minutes, then test: `https://lockinatcheckmate.app`

Check propagation: [dnschecker.org](https://dnschecker.org/#A/lockinatcheckmate.app)

---

## 3. Vercel environment variable

**Settings → Environment Variables** (Production):

```
NEXT_PUBLIC_APP_URL=https://lockinatcheckmate.app
```

No trailing slash. **Redeploy** after saving.

---

## 4. Supabase Auth URLs

[Supabase URL Configuration](https://supabase.com/dashboard/project/nfpeasuabkwobyvocecc/auth/url-configuration)

| Setting | Value |
|---------|--------|
| **Site URL** | `https://lockinatcheckmate.app` |
| **Redirect URLs** | `https://lockinatcheckmate.app/auth/callback` |
| | `https://lockinatcheckmate.app/**` |

**Keep** for local dev:

- `http://localhost:3004/auth/callback`
- `http://localhost:3004/**`

**Optional:** keep your `*.vercel.app` URLs during transition.

Google/Apple OAuth redirect URIs stay on `https://nfpeasuabkwobyvocecc.supabase.co/auth/v1/callback` — no change.

---

## 5. Verify

```text
https://lockinatcheckmate.app/login          → login page
https://lockinatcheckmate.app/api/auth/health → appUrl should show custom domain
```

Sign in with Google — you should return to `lockinatcheckmate.app`, not Vercel.

---

## Skip for now

- **Inngest** — not required for the site to load or for auth.
