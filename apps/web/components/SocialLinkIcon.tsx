import type { SocialLinkPlatformId } from "@checkmate/shared";
import type { ComponentType, ReactNode } from "react";

type IconProps = { className?: string };

function BrandIcon({
  className = "h-[18px] w-[18px]",
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="Instagram">
      <defs>
        <linearGradient id="cm-ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="25%" stopColor="#fa7e1e" />
          <stop offset="50%" stopColor="#d62976" />
          <stop offset="75%" stopColor="#962fbf" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#cm-ig)" />
      <path
        fill="#fff"
        d="M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zm5.4-8.1a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM17.4 4.8H6.6A1.8 1.8 0 0 0 4.8 6.6v10.8c0 1 .8 1.8 1.8 1.8h10.8a1.8 1.8 0 0 0 1.8-1.8V6.6a1.8 1.8 0 0 0-1.8-1.8zm-1 12.6H7.6a.8.8 0 0 1-.8-.8V7.6c0-.4.4-.8.8-.8h8.8c.4 0 .8.4.8.8v8.8c0 .4-.4.8-.8.8z"
      />
    </BrandIcon>
  );
}

function LinkedInIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="LinkedIn">
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.58 0 4.24 2.36 4.24 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45z"
      />
    </BrandIcon>
  );
}

function EmailIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="Email">
      <rect width="24" height="24" rx="4" fill="#EA4335" />
      <path
        fill="#fff"
        d="M4.5 7.5h15v9h-15v-9zm1.5 1.5 6 4.5 6-4.5H6zm0 6.3 5.25-3.9L6 8.7v6.3zm12-6.3-5.25 3.9L18 15v-6.3z"
      />
    </BrandIcon>
  );
}

function GitHubIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="GitHub">
      <path
        fill="#181717"
        className="dark:fill-white"
        d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.36 1.11 2.94.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.32.1-2.74 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.48.1 2.74.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
      />
    </BrandIcon>
  );
}

function StravaIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="Strava">
      <path fill="#FC4C02" d="M15.387 17.94 8.315 7.78l-2.428 4.56-3.707-4.56L1 17.94h2.11l.98-5.65 3.14 5.4 6.52-11.41 4.35 7.46 2.13-10.04h-2.11z" />
    </BrandIcon>
  );
}

function NikeRunClubIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="Nike Run Club">
      <path fill="#111111" className="dark:fill-white" d="M24 7.8 6.972 24 2.032 20.794 10.447 11.4 8.305 7.8z" />
    </BrandIcon>
  );
}

function TwitterIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="X">
      <path
        fill="#000000"
        className="dark:fill-white"
        d="M13.68 10.62 20.8 3h-1.69l-6.2 6.61L8.4 3H3.5l7.46 8.93L3.5 21h1.69l6.55-6.96 5.24 6.96h4.9l-7.8-10.28zm-2.28 2.44-.75-1.01L5.2 4.3h2.57l4.82 6.45.75 1.01 6.26 8.38h-2.57l-5.1-6.83z"
      />
    </BrandIcon>
  );
}

function TiktokIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="TikTok">
      <path
        fill="#25F4EE"
        d="M19.89 6.39a4.83 4.83 0 0 1-3.77-4.25V1.7h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V8.71a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.39a8.18 8.18 0 0 0 4.77 1.52V6.46a4.85 4.85 0 0 1-1-.07z"
      />
      <path
        fill="#FE2C55"
        d="M19.29 6.99a4.83 4.83 0 0 1-3.77-4.25V2.3h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.31a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.99a8.18 8.18 0 0 0 4.77 1.52V7.06a4.85 4.85 0 0 1-1-.07z"
      />
      <path
        fill="#000000"
        className="dark:fill-white"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z"
      />
    </BrandIcon>
  );
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="YouTube">
      <path
        fill="#FF0000"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.6 15.5V8.5l6.3 3.5-6.3 3.5z"
      />
    </BrandIcon>
  );
}

function WebsiteIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className} label="Website">
      <circle cx="12" cy="12" r="10" fill="#6366F1" />
      <path
        fill="#fff"
        d="M12 6.5c-2.5 0-4.5 2.2-4.5 5s2 5 4.5 5 4.5-2.2 4.5-5-2-5-4.5-5zm-6.5 5h3.2a9.5 9.5 0 0 0 .4 2H5.5a7.5 7.5 0 0 1 0-2zm6.5 6.5c-.7 0-1.4-.2-2-.5h4c-.6.3-1.3.5-2 .5zm5.8-1.5h-3.2a9.5 9.5 0 0 1-.4-2h3.6a7.5 7.5 0 0 0 0 2zM12 7.5c.7 0 1.4.2 2 .5h-4c.6-.3 1.3-.5 2-.5zM7.1 9.5h9.8a8.5 8.5 0 0 1 0 5H7.1a8.5 8.5 0 0 1 0-5z"
      />
    </BrandIcon>
  );
}

const BRAND_ICONS: Record<SocialLinkPlatformId, ComponentType<IconProps>> = {
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  email: EmailIcon,
  github: GitHubIcon,
  strava: StravaIcon,
  nike_run_club: NikeRunClubIcon,
  twitter: TwitterIcon,
  tiktok: TiktokIcon,
  youtube: YoutubeIcon,
  website: WebsiteIcon,
};

export function SocialLinkIcon({
  platformId,
  className = "h-[18px] w-[18px]",
}: {
  platformId: SocialLinkPlatformId;
  className?: string;
}) {
  const Icon = BRAND_ICONS[platformId] ?? WebsiteIcon;
  return <Icon className={className} />;
}
