"use client";

import { SocialLinkIcon } from "@/components/SocialLinkIcon";
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
        const ariaLabel = isEmail
          ? `Email ${socialLinkDisplayEmail(stored)}`
          : platform.label;

        return (
          <a
            key={platform.id}
            href={href}
            aria-label={ariaLabel}
            title={ariaLabel}
            {...(isEmail
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gp-border)] text-[var(--gp-fg)] hover:bg-[var(--gp-surface)] hover:border-accent/50 hover:text-accent transition-colors"
          >
            <SocialLinkIcon platformId={platform.id} />
          </a>
        );
      })}
    </div>
  );
}
