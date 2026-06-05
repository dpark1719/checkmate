"use client";

import {
  getOAuthCallbackUrl,
  isLocalDevHost,
  localDevRedirectUrls,
  supabaseAuthUrlSettingsLink,
} from "@/lib/auth/oauth-redirect";
import { useEffect, useState } from "react";

const SUPABASE_PROJECT_REF = "nfpeasuabkwobyvocecc";

export function LocalDevAuthHint() {
  const [visible, setVisible] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLocalDevHost(window.location.hostname)) return;
    setVisible(true);
    setCallbackUrl(getOAuthCallbackUrl(window.location.origin));
  }, []);

  if (!visible || !callbackUrl) return null;

  const redirectUrls = localDevRedirectUrls(window.location.port || "3004");
  const settingsUrl = supabaseAuthUrlSettingsLink(SUPABASE_PROJECT_REF);

  return (
    <div
      role="note"
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90 space-y-2"
    >
      <p className="font-medium text-amber-100">Local dev: Google login redirect</p>
      <p className="text-xs leading-relaxed">
        If sign-in sends you to <strong>Vercel</strong> instead of localhost,
        Supabase is using your production Site URL. Add these under{" "}
        <strong>Redirect URLs</strong> (keep Site URL as production):
      </p>
      <ul className="text-xs font-mono space-y-1 gp-text-muted">
        {redirectUrls.map((url) => (
          <li key={url}>{url}</li>
        ))}
      </ul>
      <p className="text-xs">
        This session will use:{" "}
        <code className="text-amber-100/90">{callbackUrl}</code>
      </p>
      <a
        href={settingsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs font-medium text-accent hover:underline"
      >
        Open Supabase URL settings →
      </a>
    </div>
  );
}
