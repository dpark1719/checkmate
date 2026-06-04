import type { MockLeaderboardEntry } from "@/lib/landing/mockData";
import Link from "next/link";

interface LeaderboardTeaserProps {
  entries: MockLeaderboardEntry[];
  compact?: boolean;
}

export function LeaderboardTeaser({ entries, compact }: LeaderboardTeaserProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <h3
        className={`font-semibold text-center ${
          compact ? "text-sm" : "text-lg"
        }`}
      >
        Top Streaks This Week
      </h3>

      <ol className={compact ? "space-y-1.5" : "space-y-3"}>
        {entries.map((entry) => {
          const isFirst = entry.rank === 1;
          return (
            <li
              key={entry.rank}
              className={`flex items-center gap-2 rounded-lg border ${
                compact ? "px-2.5 py-1.5" : "px-4 py-3"
              } ${
                isFirst
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-[var(--gp-border)] bg-[var(--gp-card)]"
              } ${isFirst && !compact ? "scale-[1.02] shadow-md" : ""}`}
            >
              <span
                className={`text-center shrink-0 ${compact ? "text-sm w-5" : "text-xl w-8"}`}
                aria-hidden
              >
                {entry.badge}
              </span>
              <span
                className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${
                  compact ? "h-6 w-6 text-[9px]" : "h-10 w-10 text-sm"
                }`}
                style={{ backgroundColor: entry.avatarColor }}
                aria-hidden
              >
                {entry.avatarInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium truncate ${compact ? "text-xs" : ""}`}
                >
                  {entry.username}
                </p>
                <p className="text-[10px] gp-text-muted capitalize truncate">
                  {entry.goalEmoji} {entry.goalCategory}
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
            </li>
          );
        })}
      </ol>

      <p className={`text-center ${compact ? "pt-0" : "pt-2"}`}>
        <Link href="/signup" className="gp-link text-xs sm:text-sm">
          Where do you rank? Start your streak →
        </Link>
      </p>
    </div>
  );
}
