"use client";

import {
  SOCIAL_LINK_PLATFORMS,
  type SocialLinkPlatformId,
  type SocialLinks,
} from "@goalpost/shared";

export function SocialLinksEditor({
  values,
  onChange,
}: {
  values: Record<SocialLinkPlatformId, string>;
  onChange: (values: Record<SocialLinkPlatformId, string>) => void;
}) {
  return (
    <div className="space-y-3 border-t border-zinc-800 pt-4">
      <div>
        <h3 className="text-sm font-medium text-zinc-300">Connect accounts</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Paste a profile link so others can find you on Instagram, Strava, and more.
        </p>
      </div>
      {SOCIAL_LINK_PLATFORMS.map((platform) => (
        <div key={platform.id}>
          <label className="text-sm text-zinc-400">{platform.label}</label>
          <input
            type="url"
            inputMode="url"
            autoComplete="url"
            value={values[platform.id] ?? ""}
            onChange={(e) =>
              onChange({ ...values, [platform.id]: e.target.value })
            }
            placeholder={platform.placeholder}
            className="gp-input mt-1"
          />
        </div>
      ))}
    </div>
  );
}

export function socialLinksToFormState(
  links: SocialLinks | Record<string, string> | null | undefined
): Record<SocialLinkPlatformId, string> {
  const out = {} as Record<SocialLinkPlatformId, string>;
  for (const p of SOCIAL_LINK_PLATFORMS) {
    out[p.id] = (links?.[p.id] as string | undefined) ?? "";
  }
  return out;
}
