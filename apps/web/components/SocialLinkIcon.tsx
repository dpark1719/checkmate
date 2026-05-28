import type { ComponentType } from "react";
import type { SocialLinkPlatformId } from "@checkmate/shared";
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

type IconProps = { className?: string };

function StravaIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M15.387 17.94 8.315 7.78l-2.428 4.56-3.707-4.56L1 17.94h2.11l.98-5.65 3.14 5.4 6.52-11.41 4.35 7.46 2.13-10.04h-2.11z" />
    </svg>
  );
}

function TiktokIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  );
}

function NikeRunClubIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M24 7.8 6.972 24 2.032 20.794 10.447 11.4 8.305 7.8z" />
    </svg>
  );
}

const LUCIDE_ICONS: Partial<Record<SocialLinkPlatformId, LucideIcon>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  email: Mail,
  github: Github,
  twitter: Twitter,
  youtube: Youtube,
  website: Globe,
};

const CUSTOM_ICONS: Partial<
  Record<SocialLinkPlatformId, ComponentType<IconProps>>
> = {
  strava: StravaIcon,
  nike_run_club: NikeRunClubIcon,
  tiktok: TiktokIcon,
};

export function SocialLinkIcon({
  platformId,
  className = "h-[18px] w-[18px]",
}: {
  platformId: SocialLinkPlatformId;
  className?: string;
}) {
  const Lucide = LUCIDE_ICONS[platformId];
  if (Lucide) return <Lucide className={className} strokeWidth={2} aria-hidden />;

  const Custom = CUSTOM_ICONS[platformId];
  if (Custom) return <Custom className={className} />;

  return <Globe className={className} strokeWidth={2} aria-hidden />;
}
