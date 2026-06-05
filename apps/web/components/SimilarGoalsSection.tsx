"use client";

import {
  GoalProgressComparison,
  type GoalComparisonPost,
  type GoalStatsDisplay,
} from "@/components/GoalProgressComparison";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SimilarCompletedGoal {
  id: string;
  title: string;
  category: string;
  completedAt: string;
  completionNote: string | null;
  stats: GoalStatsDisplay;
  startPost: GoalComparisonPost | null;
  endPost: GoalComparisonPost | null;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface SimilarActiveGoal {
  id: string;
  title: string;
  category: string;
  targetEndDate: string | null;
  checkInCount: number;
  currentStreak: number;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface SimilarGoalsSectionProps {
  title: string;
  category: string;
}

export function SimilarGoalsSection({ title, category }: SimilarGoalsSectionProps) {
  const [completed, setCompleted] = useState<SimilarCompletedGoal[]>([]);
  const [active, setActive] = useState<SimilarActiveGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({ title, category });
    Promise.all([
      fetch(`/api/goals/similar?${params}&status=completed&limit=6`).then((r) =>
        r.json()
      ),
      fetch(`/api/goals/similar?${params}&status=active&limit=6`).then((r) =>
        r.json()
      ),
    ])
      .then(([completedData, activeData]) => {
        if (cancelled) return;
        setCompleted(completedData.completed ?? []);
        setActive(activeData.active ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setCompleted([]);
          setActive([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [title, category]);

  if (loading) {
    return <p className="text-sm gp-text-muted">Loading similar goals…</p>;
  }

  if (completed.length === 0 && active.length === 0) {
    return (
      <p className="text-sm gp-text-muted">
        No one else with this exact goal title yet — finish strong and be the first
        others can learn from.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {completed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Others who finished this</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {completed.map((goal) => (
              <GoalProgressComparison
                key={goal.id}
                title={goal.title}
                category={goal.category}
                stats={goal.stats}
                startPost={goal.startPost}
                endPost={goal.endPost}
                completionNote={goal.completionNote}
                username={goal.user.username}
                compact
              />
            ))}
          </div>
        </section>
      ) : null}

      {active.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Others working on this</h2>
          <ul className="space-y-2">
            {active.map((goal) => (
              <li
                key={goal.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--gp-border)] px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/u/${goal.user.username}`}
                    className="font-medium text-sm hover:underline truncate block"
                  >
                    @{goal.user.username}
                  </Link>
                  <p className="text-xs gp-text-muted capitalize">
                    {goal.checkInCount} check-in
                    {goal.checkInCount === 1 ? "" : "s"}
                    {goal.currentStreak > 0
                      ? ` · ${goal.currentStreak}🔥 streak`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
