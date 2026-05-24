/** Platforms users can link on their GoalPost profile */
export const SOCIAL_LINK_PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "instagram.com/you",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "linkedin.com/in/you",
  },
  { id: "github", label: "GitHub", placeholder: "github.com/you" },
  {
    id: "strava",
    label: "Strava",
    placeholder: "strava.com/athletes/…",
  },
  {
    id: "nike_run_club",
    label: "Nike Run Club",
    placeholder: "nike.com/member/…",
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    placeholder: "x.com/you",
  },
  { id: "tiktok", label: "TikTok", placeholder: "tiktok.com/@you" },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "youtube.com/@you",
  },
  { id: "website", label: "Website", placeholder: "yoursite.com" },
] as const;

export type SocialLinkPlatformId =
  (typeof SOCIAL_LINK_PLATFORMS)[number]["id"];

export const SOCIAL_LINK_PLATFORM_IDS = SOCIAL_LINK_PLATFORMS.map(
  (p) => p.id
) as SocialLinkPlatformId[];

export type SocialLinks = Partial<Record<SocialLinkPlatformId, string>>;

/** Normalize user input to https URL or null if empty */
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
    const normalized = normalizeSocialLinkUrl(v);
    if (normalized) out[id] = normalized;
  }
  return out;
}
