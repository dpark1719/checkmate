import { UserAvatar } from "@/components/UserAvatar";
import { goalCategoryEmoji } from "@/lib/goal-categories";
import Link from "next/link";

export interface LeaderboardTeaserEntry {
  rank: number;
  displayName: string;
  username?: string;
  avatarUrl?: string | null;
  goalCategory: string;
  goalTitle?: string | null;
  streakDays: number;
}

function rankBadge(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

interface LeaderboardTeaserProps {
  entries: LeaderboardTeaserEntry[];
  compact?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  title?: string;
  showCta?: boolean;
  emptyMessage?: string;
}

export function LeaderboardTeaser({
  entries,
  compact,
  ctaHref = "/signup",
  ctaLabel = "Where do you rank? Start your streak →",
  title = "Top Streaks This Week",
  showCta = true,
  emptyMessage,
}: LeaderboardTeaserProps) {
  if (entries.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className={compact ? "space-y-2" : "space-y-4"}>
        {title ? (
          <h3
            className={`font-semibold text-center ${
              compact ? "text-sm" : "text-lg"
            }`}
          >
            {title}
          </h3>
        ) : null}
        <p className="gp-text-muted text-sm text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {title ? (
        <h3
          className={`font-semibold text-center ${
            compact ? "text-sm" : "text-lg"
          }`}
        >
          {title}
        </h3>
      ) : null}

      <ol className={compact ? "space-y-1.5" : "space-y-3"}>
        {entries.map((entry) => {
          const isFirst = entry.rank === 1;
          const emoji = goalCategoryEmoji(entry.goalCategory);
          const profileHref = entry.username ? `/u/${entry.username}` : null;
          const rowClassName = `flex items-center gap-2 rounded-lg border ${
            compact ? "px-2.5 py-1.5" : "px-4 py-3"
          } ${
            isFirst
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-[var(--gp-border)] bg-[var(--gp-card)]"
          } ${isFirst && !compact ? "scale-[1.02] shadow-md" : ""} ${
            profileHref
              ? "transition-colors hover:bg-[var(--gp-surface)] hover:border-accent/30"
              : ""
          }`;

          const rowContent = (
            <>
              <span
                className={`text-center shrink-0 ${compact ? "text-sm w-5" : "text-xl w-8"}`}
                aria-hidden
              >
                {rankBadge(entry.rank)}
              </span>
              <UserAvatar
                displayName={entry.displayName}
                avatarUrl={entry.avatarUrl}
                size={compact ? "sm" : "md"}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium truncate ${compact ? "text-xs" : ""}`}
                >
                  {entry.displayName}
                </p>
                <p className="text-[10px] gp-text-muted capitalize truncate">
                  {emoji} {entry.goalCategory}
                </p>
              </div>
              <p
                className={`shrink-0 font-bold tabular-nums ${
                  isFirst
                    ? compact
                      ? "text-sm text-amber-500"
                      : "text-lg text-amber-500"
                    : compact
                      ? "text-xs"
                      : "text-base"
                }`}
              >
                {entry.streakDays}🔥
              </p>
            </>
          );

          return (
            <li key={`${entry.rank}-${entry.username ?? entry.displayName}`}>
              {profileHref ? (
                <Link
                  href={profileHref}
                  className={rowClassName}
                  aria-label={`${entry.displayName}, ${entry.streakDays} day streak`}
                >
                  {rowContent}
                </Link>
              ) : (
                <div className={rowClassName}>{rowContent}</div>
              )}
            </li>
          );
        })}
      </ol>

      {showCta && (
        <p className={`text-center ${compact ? "pt-0" : "pt-2"}`}>
          <Link href={ctaHref} className="gp-link text-xs sm:text-sm">
            {ctaLabel}
          </Link>
        </p>
      )}
    </div>
  );
}
