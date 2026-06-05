"use client";

import { PostChallengeCard } from "@/components/PostChallengeCard";
import { PostGoalGrid } from "@/components/PostGoalGrid";
import { goalCategoryEmoji } from "@/lib/goal-categories";
import { countGoalTitles, isDuplicateGoalTitle } from "@/lib/goal-titles";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Challenge {
  id: string;
  goalId: string;
  triggerFiredAt: string | null;
  promiseTime: string | null;
  leewayExpiresAt: string | null;
  postedAt: string | null;
  postId?: string;
  goals?: { title: string; category: string; defaultPromiseTime?: string };
}

function defaultSelectedId(challenges: Challenge[]): string | null {
  if (challenges.length === 0) return null;
  const next = challenges.find((c) => !c.postedAt);
  return next?.id ?? challenges[0].id;
}

export default function PostPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/challenges/today")
      .then((r) => r.json())
      .then((data) => {
        const next = (data.challenges ?? []) as Challenge[];
        setChallenges(next);
        setSelectedId((prev) => {
          if (prev && next.some((c) => c.id === prev)) return prev;
          return defaultSelectedId(next);
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const titleCounts = useMemo(
    () =>
      countGoalTitles(
        challenges.map((c) => c.goals?.title ?? "").filter(Boolean)
      ),
    [challenges]
  );
  const hasDuplicateTitles = [...titleCounts.values()].some((n) => n > 1);

  const postedCount = challenges.filter((c) => c.postedAt).length;
  const selected = challenges.find((c) => c.id === selectedId) ?? null;
  const progress =
    challenges.length > 0 ? (postedCount / challenges.length) * 100 : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Today&apos;s post</h1>
        {!loading && challenges.length > 0 && (
          <>
            <p className="text-sm gp-text-muted">
              {postedCount} of {challenges.length} goal
              {challenges.length === 1 ? "" : "s"} posted today
            </p>
            <div
              className="h-1.5 rounded-full bg-[var(--gp-surface)] overflow-hidden"
              role="progressbar"
              aria-valuenow={postedCount}
              aria-valuemin={0}
              aria-valuemax={challenges.length}
            >
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </div>

      {loading ? (
        <p className="gp-text-muted">Loading challenges…</p>
      ) : challenges.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-[var(--gp-border)] p-8 text-center">
          <p className="gp-text-muted">
            No challenges for today. Add a goal to get started.
          </p>
          <Link
            href="/goals"
            className="inline-block rounded-lg bg-accent text-accent-foreground font-semibold px-6 py-2"
          >
            Manage goals
          </Link>
        </div>
      ) : (
        <>
          {hasDuplicateTitles && (
            <p className="text-sm text-amber-500 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              You have more than one active goal with the same name. Each gets its
              own daily post — remove the extra on the{" "}
              <Link href="/goals" className="underline font-medium">
                Goals
              </Link>{" "}
              tab.
            </p>
          )}

          <PostGoalGrid
            challenges={challenges}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {selected && (
            <section className="rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-card)]/50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--gp-border)] mb-4">
                <span className="text-2xl" aria-hidden>
                  {goalCategoryEmoji(selected.goals?.category ?? "other")}
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold truncate">
                    {selected.goals?.title ?? "Goal"}
                  </h2>
                  <p className="text-xs gp-text-muted capitalize">
                    {selected.goals?.category}
                  </p>
                </div>
              </div>
              <PostChallengeCard
                key={selected.id}
                challenge={selected}
                onPosted={load}
                showHeader={false}
                duplicateTitle={isDuplicateGoalTitle(
                  selected.goals?.title ?? "",
                  titleCounts
                )}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
