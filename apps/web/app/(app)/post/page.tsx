"use client";

import { PostChallengeCard } from "@/components/PostChallengeCard";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Challenge {
  id: string;
  goalId: string;
  triggerFiredAt: string | null;
  promiseTime: string | null;
  leewayExpiresAt: string | null;
  postedAt: string | null;
  postId?: string;
  goals?: { title: string; category: string };
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Today&apos;s post</h1>
      {loading ? (
        <p className="text-zinc-400">Loading challenges…</p>
      ) : challenges.length === 0 ? (
        <div className="space-y-4">
          <p className="text-zinc-400">
            No challenges for today. Add a goal to get started.
          </p>
          <Link
            href="/goals"
            className="inline-block rounded-lg bg-emerald-500 text-zinc-950 font-semibold px-6 py-2"
          >
            Manage goals
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {challenges.map((c) => (
            <PostChallengeCard key={c.id} challenge={c} onPosted={load} />
          ))}
        </ul>
      )}
    </div>
  );
}
