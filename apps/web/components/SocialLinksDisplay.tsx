"use client";

import {
  SOCIAL_LINK_PLATFORMS,
  type SocialLinks,
} from "@goalpost/shared";

export function SocialLinksDisplay({ links }: { links: SocialLinks | null | undefined }) {
  const entries = SOCIAL_LINK_PLATFORMS.filter((p) => links?.[p.id]);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((platform) => {
        const href = links![platform.id]!;
        return (
          <a
            key={platform.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm rounded-full border border-zinc-700 px-3 py-1 text-emerald-400 hover:bg-zinc-900 hover:border-emerald-500/50"
          >
            {platform.label}
          </a>
        );
      })}
    </div>
  );
}
