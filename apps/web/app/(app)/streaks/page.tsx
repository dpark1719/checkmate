"use client";

import { GOAL_CATEGORIES, type GoalCategory } from "@checkmate/shared";
import { useEffect, useState } from "react";

interface Streak {
  id: string;
  goalId: string;
  currentCount: number;
  longestCount: number;
  goals?: { title: string; category: string };
}

interface LeaderEntry {
  rank: number;
  displayName: string;
  username: string;
  score: number;
  goalTitle: string;
}

export default function StreaksPage() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [category, setCategory] = useState<GoalCategory>("fitness");
  const [period, setPeriod] = useState<"weekly" | "all_time">("weekly");
  const [scope, setScope] = useState<"global" | "regional">("global");
  const [entries, setEntries] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    fetch("/api/streaks/me")
      .then((r) => r.json())
      .then((d) => setStreaks(d.streaks ?? []));
  }, []);

  useEffect(() => {
    fetch(
      `/api/leaderboards/${category}?period=${period}&scope=${scope}`
    )
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []));
  }, [category, period, scope]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Your streaks</h1>
        {streaks.length === 0 ? (
          <p className="gp-text-muted">Post daily to build streaks.</p>
        ) : (
          <ul className="space-y-3">
            {streaks.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-[var(--gp-border)] px-4 py-3 flex justify-between"
              >
                <div>
                  <p className="font-medium">{s.goals?.title ?? "Goal"}</p>
                  <p className="text-sm gp-text-muted capitalize">
                    {s.goals?.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">
                    {s.currentCount}
                  </p>
                  <p className="text-xs gp-text-muted">
                    best {s.longestCount}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Leaderboard</h2>
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
            <option value="weekly">Weekly</option>
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
        {entries.length === 0 ? (
          <p className="gp-text-muted text-sm">
            Leaderboard appears when enough members are active in this category.
          </p>
        ) : (
          <ol className="space-y-2">
            {entries.map((e) => (
              <li
                key={`${e.rank}-${e.username}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--gp-border)] px-4 py-2"
              >
                <span className="gp-text-muted w-6">#{e.rank}</span>
                <div className="flex-1">
                  <p className="font-medium">{e.displayName}</p>
                  <p className="text-xs gp-text-muted">
                    {e.goalTitle} · @{e.username}
                  </p>
                </div>
                <span className="text-accent font-bold">{e.score}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
