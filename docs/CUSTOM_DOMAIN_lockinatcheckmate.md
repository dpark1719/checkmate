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

---

## Troubleshooting: “Safari Can’t Find the Server” but Vercel shows green

DNS can be correct on Cloudflare / public resolvers while your **home router** still returns nothing.

**Verify:** Public DNS works when `dig @1.1.1.1 lockinatcheckmate.app A` returns IPs (e.g. `64.29.17.1`). If your Mac’s default DNS (often `192.168.0.1`) returns empty, the site will fail in Safari until that cache updates.

**Fix (pick one):**

1. **Use Cloudflare DNS on your Mac** (fastest): System Settings → Network → Wi‑Fi → Details → DNS → add `1.1.1.1` and `8.8.8.8`, remove others, apply.
2. **Flush Mac DNS cache:**
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```
3. **Restart your router** — forces it to drop stale negative cache.
4. **Wait** — some ISP routers lag 30 min–24 h after DNS changes.

**Expected Cloudflare records after Vercel authorize:**

| Name | Type | Content |
|------|------|---------|
| `@` | CNAME | `278ecc811abfa8eb.vercel-dns-017.com` |
| `www` | CNAME | `cname.vercel-dns.com` |
| `_vercel` | TXT | verification string |

All **DNS only** (grey cloud). No A record needed on `@` after Vercel CNAME is in place.
