"use client";

import Link from "next/link";

export interface GoalComparisonPost {
  id: string;
  photoUrl: string;
  createdAt: string;
}

export interface GoalStatsDisplay {
  daysActive: number;
  checkInCount: number;
  currentStreak: number;
  longestStreak: number;
  completionDate: string | null;
}

interface GoalProgressComparisonProps {
  title: string;
  category: string;
  stats: GoalStatsDisplay;
  startPost: GoalComparisonPost | null;
  endPost: GoalComparisonPost | null;
  completionNote?: string | null;
  username?: string;
  compact?: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GoalProgressComparison({
  title,
  category,
  stats,
  startPost,
  endPost,
  completionNote,
  username,
  compact = false,
}: GoalProgressComparisonProps) {
  return (
    <article
      className={`rounded-xl border border-[var(--gp-border)] overflow-hidden ${
        compact ? "" : "gp-card"
      }`}
    >
      <div className="p-4 space-y-3">
        <div>
          <h3 className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>
            {title}
          </h3>
          <p className="text-xs gp-text-muted capitalize">
            {category}
            {username ? (
              <>
                {" · "}
                <Link href={`/u/${username}`} className="hover:underline">
                  @{username}
                </Link>
              </>
            ) : null}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs gp-text-muted uppercase tracking-wide">Start</p>
            {startPost ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={startPost.photoUrl}
                alt="Starting progress"
                className="aspect-square w-full rounded-lg object-cover bg-[var(--gp-surface)]"
              />
            ) : (
              <div className="aspect-square w-full rounded-lg bg-[var(--gp-surface)] flex items-center justify-center text-xs gp-text-muted">
                No photo
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs gp-text-muted uppercase tracking-wide">End</p>
            {endPost ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={endPost.photoUrl}
                alt="Final progress"
                className="aspect-square w-full rounded-lg object-cover bg-[var(--gp-surface)]"
              />
            ) : (
              <div className="aspect-square w-full rounded-lg bg-[var(--gp-surface)] flex items-center justify-center text-xs gp-text-muted">
                No photo
              </div>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
          <div>
            <dt className="gp-text-muted">Days active</dt>
            <dd className="font-medium">{stats.daysActive}</dd>
          </div>
          <div>
            <dt className="gp-text-muted">Check-ins</dt>
            <dd className="font-medium">{stats.checkInCount}</dd>
          </div>
          <div>
            <dt className="gp-text-muted">Best streak</dt>
            <dd className="font-medium">{stats.longestStreak}🔥</dd>
          </div>
          <div>
            <dt className="gp-text-muted">Completed</dt>
            <dd className="font-medium">{formatDate(stats.completionDate)}</dd>
          </div>
        </dl>

        {completionNote ? (
          <p className="text-sm gp-text-muted whitespace-pre-wrap border-t border-[var(--gp-border)] pt-3">
            {completionNote}
          </p>
        ) : null}
      </div>
    </article>
  );
}
