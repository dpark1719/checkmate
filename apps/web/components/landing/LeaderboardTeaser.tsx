import type { MockLeaderboardEntry } from "@/lib/landing/mockData";
import Link from "next/link";

interface LeaderboardTeaserProps {
  entries: MockLeaderboardEntry[];
}

export function LeaderboardTeaser({ entries }: LeaderboardTeaserProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">
        Top Streaks This Week
      </h3>

      <ol className="space-y-3">
        {entries.map((entry) => {
          const isFirst = entry.rank === 1;
          return (
            <li
              key={entry.rank}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                isFirst
                  ? "border-amber-500/40 bg-amber-500/10 scale-[1.02] shadow-md"
                  : "border-[var(--gp-border)] bg-[var(--gp-card)]"
              }`}
            >
              <span className="text-xl w-8 text-center shrink-0" aria-hidden>
                {entry.badge}
              </span>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: entry.avatarColor }}
                aria-hidden
              >
                {entry.avatarInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{entry.username}</p>
                <p className="text-xs gp-text-muted capitalize">
                  {entry.goalEmoji} {entry.goalCategory}
                </p>
              </div>
              <p
                className={`shrink-0 font-bold tabular-nums ${
                  isFirst ? "text-lg text-amber-500" : "text-base"
                }`}
              >
                {entry.streakDays}🔥
              </p>
            </li>
          );
        })}
      </ol>

      <p className="text-center pt-2">
        <Link href="/signup" className="gp-link text-sm">
          Where do you rank? Start your streak →
        </Link>
      </p>
    </div>
  );
}
