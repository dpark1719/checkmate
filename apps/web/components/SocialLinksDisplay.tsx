"use client";

import {
  SOCIAL_LINK_PLATFORMS,
  socialLinkDisplayEmail,
  socialLinkHref,
  type SocialLinks,
} from "@goalpost/shared";

export function SocialLinksDisplay({ links }: { links: SocialLinks | null | undefined }) {
  const entries = SOCIAL_LINK_PLATFORMS.filter((p) => links?.[p.id]);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((platform) => {
        const stored = links![platform.id]!;
        const href = socialLinkHref(platform.id, stored);
        const isEmail = platform.kind === "email";
        const label = isEmail
          ? socialLinkDisplayEmail(stored)
          : platform.label;

        return (
          <a
            key={platform.id}
            href={href}
            {...(isEmail
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            className="text-sm rounded-full border border-[var(--gp-border)] px-3 py-1 text-emerald-500 hover:bg-[var(--gp-surface)] hover:border-emerald-500/50"
          >
            {isEmail ? `✉ ${label}` : label}
          </a>
        );
      })}
    </div>
  );
}
