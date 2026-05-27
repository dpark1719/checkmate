import { User } from "lucide-react";

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function UserAvatar({
  displayName,
  avatarUrl,
  size = "md",
  className = "",
}: {
  displayName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
        ? "h-24 w-24 text-2xl"
        : "h-12 w-12 text-sm";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`rounded-full object-cover bg-[var(--gp-surface)] shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[var(--gp-surface)] border border-[var(--gp-border)] text-[var(--gp-muted)] font-semibold shrink-0 ${sizeClass} ${className}`}
      aria-hidden
    >
      {displayName.trim() ? initials(displayName) : <User className="h-1/2 w-1/2" />}
    </span>
  );
}
