/** OAuth return URL — always the browser origin, never NEXT_PUBLIC_APP_URL. */
export function getOAuthCallbackUrl(origin: string, next = "/feed"): string {
  const base = origin.replace(/\/$/, "");
  const path = next.startsWith("/") ? next : `/${next}`;
  return `${base}/auth/callback?next=${encodeURIComponent(path)}`;
}

export function isLocalDevHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** Redirect URLs to allow in Supabase → Authentication → URL Configuration. */
export function localDevRedirectUrls(port = "3004"): string[] {
  const hosts = ["localhost", "127.0.0.1"];
  const urls = new Set<string>();
  for (const host of hosts) {
    const base = `http://${host}:${port}`;
    urls.add(`${base}/auth/callback`);
    urls.add(`${base}/**`);
  }
  return [...urls];
}

export function supabaseAuthUrlSettingsLink(projectRef: string): string {
  return `https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`;
}
