"use client";

import { PostChallengeCard } from "@/components/PostChallengeCard";
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

export default function PostPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/challenges/today")
      .then((r) => r.json())
      .then((data) => {
        setChallenges(data.challenges ?? []);
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Today&apos;s post</h1>
      {loading ? (
        <p className="gp-text-muted">Loading challenges…</p>
      ) : challenges.length === 0 ? (
        <div className="space-y-4">
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
              own daily post below — remove the extra on the{" "}
              <Link href="/goals" className="underline font-medium">
                Goals
              </Link>{" "}
              tab.
            </p>
          )}
          <ul className="space-y-4">
            {challenges.map((c) => (
              <PostChallengeCard
                key={c.id}
                challenge={c}
                onPosted={load}
                duplicateTitle={isDuplicateGoalTitle(
                  c.goals?.title ?? "",
                  titleCounts
                )}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
