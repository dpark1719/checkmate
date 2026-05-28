/** Platforms users can link on their CheckMate profile */
export const SOCIAL_LINK_PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "instagram.com/you",
    kind: "url" as const,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "linkedin.com/in/you",
    kind: "url" as const,
  },
  {
    id: "email",
    label: "Email",
    placeholder: "you@example.com",
    kind: "email" as const,
  },
  {
    id: "github",
    label: "GitHub",
    placeholder: "github.com/you",
    kind: "url" as const,
  },
  {
    id: "strava",
    label: "Strava",
    placeholder: "strava.com/athletes/…",
    kind: "url" as const,
  },
  {
    id: "nike_run_club",
    label: "Nike Run Club",
    placeholder: "nike.com/member/…",
    kind: "url" as const,
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    placeholder: "x.com/you",
    kind: "url" as const,
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "tiktok.com/@you",
    kind: "url" as const,
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "youtube.com/@you",
    kind: "url" as const,
  },
  {
    id: "website",
    label: "Website",
    placeholder: "yoursite.com",
    kind: "url" as const,
  },
] as const;

export type SocialLinkPlatformId =
  (typeof SOCIAL_LINK_PLATFORMS)[number]["id"];

export const SOCIAL_LINK_PLATFORM_IDS = SOCIAL_LINK_PLATFORMS.map(
  (p) => p.id
) as SocialLinkPlatformId[];

export type SocialLinks = Partial<Record<SocialLinkPlatformId, string>>;

/** Normalize user input to https URL or null if empty */
/** Public contact email → mailto: link stored in social_links */
export function normalizeContactEmail(raw: string): string | null {
  const trimmed = raw.trim().replace(/^mailto:/i, "");
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return `mailto:${trimmed.toLowerCase()}`.slice(0, 200);
}

export function socialLinkHref(
  platformId: SocialLinkPlatformId,
  stored: string
): string {
  if (platformId === "email") {
    return stored.startsWith("mailto:") ? stored : `mailto:${stored}`;
  }
  return stored;
}

export function socialLinkDisplayEmail(stored: string): string {
  return stored.replace(/^mailto:/i, "");
}

export function normalizeSocialLinkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href.slice(0, 200);
  } catch {
    return null;
  }
}

export function sanitizeSocialLinks(
  input: Record<string, unknown> | null | undefined
): SocialLinks {
  if (!input || typeof input !== "object") return {};
  const out: SocialLinks = {};
  for (const id of SOCIAL_LINK_PLATFORM_IDS) {
    const v = input[id];
    if (typeof v !== "string") continue;
    const normalized =
      id === "email" ? normalizeContactEmail(v) : normalizeSocialLinkUrl(v);
    if (normalized) out[id] = normalized;
  }
  return out;
}
