"use client";

import {
  LeaderboardTeaser,
  type LeaderboardTeaserEntry,
} from "@/components/LeaderboardTeaser";
import { goalCategoryEmoji } from "@/lib/goal-categories";
import { GOAL_CATEGORIES, type GoalCategory } from "@checkmate/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ActiveStreak {
  id: string;
  goalId: string;
  currentCount: number;
  longestCount: number;
  goals?: { title: string; category: string };
}

export default function StreaksPage() {
  const [globalEntries, setGlobalEntries] = useState<LeaderboardTeaserEntry[]>(
    []
  );
  const [category, setCategory] = useState<GoalCategory>("fitness");
  const [period, setPeriod] = useState<"weekly" | "all_time">("weekly");
  const [scope, setScope] = useState<"global" | "regional">("global");
  const [categoryEntries, setCategoryEntries] = useState<
    LeaderboardTeaserEntry[]
  >([]);
  const [activeStreaks, setActiveStreaks] = useState<ActiveStreak[]>([]);

  useEffect(() => {
    fetch("/api/leaderboards/top?limit=25")
      .then((r) => r.json())
      .then((d) => setGlobalEntries(d.entries ?? []));
  }, []);

  useEffect(() => {
    fetch(
      `/api/leaderboards/${category}?period=${period}&scope=${scope}`
    )
      .then((r) => r.json())
      .then((d) => setCategoryEntries(d.entries ?? []));
  }, [category, period, scope]);

  useEffect(() => {
    fetch("/api/streaks/me")
      .then((r) => r.json())
      .then((d) => setActiveStreaks(d.streaks ?? []));
  }, []);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="gp-text-muted text-sm">
          Rankings are based on on-time posts this week when streak counts are
          still updating overnight.
        </p>
      </div>

      <LeaderboardTeaser
        entries={globalEntries}
        title="Top streaks this week"
        showCta={false}
        emptyMessage="No streak activity yet this week. Post on time to climb the board."
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold capitalize">{category} leaderboard</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
            className="rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-3 py-2 text-sm"
          >
            {GOAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) =>
              setPeriod(e.target.value as "weekly" | "all_time")
            }
            className="rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-3 py-2 text-sm"
          >
            <option value="weekly">This week</option>
            <option value="all_time">All-time</option>
          </select>
          <select
            value={scope}
            onChange={(e) =>
              setScope(e.target.value as "global" | "regional")
            }
            className="rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-3 py-2 text-sm"
          >
            <option value="global">Global</option>
            <option value="regional">Regional</option>
          </select>
        </div>
        <LeaderboardTeaser
          entries={categoryEntries}
          compact
          title=""
          showCta={false}
          emptyMessage="No one in this category yet this period. Be the first to post."
        />
      </section>

      <section className="space-y-4 border-t border-[var(--gp-border)] pt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Your active goals</h2>
            <p className="text-sm gp-text-muted">
              One streak per active goal. Counts update after each on-time day.
            </p>
          </div>
          <Link href="/goals" className="gp-btn-text gp-btn-text-xs shrink-0">
            Manage goals →
          </Link>
        </div>
        {activeStreaks.length === 0 ? (
          <p className="gp-text-muted text-sm">
            No active goals.{" "}
            <Link href="/goals" className="gp-link">
              Create a goal
            </Link>{" "}
            to start a streak.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeStreaks.map((s) => {
              const emoji = goalCategoryEmoji(s.goals?.category ?? "other");
              const hasStreak =
                s.currentCount > 0 || s.longestCount > 0;
              return (
                <li
                  key={s.id}
                  className="rounded-xl border border-[var(--gp-border)] px-4 py-3 flex justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {s.goals?.title ?? "Goal"}
                    </p>
                    <p className="text-xs gp-text-muted capitalize truncate">
                      {emoji} {s.goals?.category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-accent tabular-nums">
                      {hasStreak ? (
                        <>
                          {s.currentCount}
                          <span className="text-sm font-medium">🔥</span>
                        </>
                      ) : (
                        <span className="text-sm font-medium gp-text-muted">
                          —
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] gp-text-muted">
                      {hasStreak
                        ? `best ${s.longestCount}`
                        : "Post to start"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
