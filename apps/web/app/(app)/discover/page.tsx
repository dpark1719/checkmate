"use client";

import { GOAL_CATEGORIES, type GoalCategory } from "@goalpost/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Community {
  id: string;
  category: string;
  memberCount: number;
}

export default function DiscoverPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data) => setCommunities(data.communities ?? []));
  }, []);

  async function toggleJoin(category: GoalCategory) {
    setLoading(category);
    const isJoined = joined.has(category);
    const res = await fetch(`/api/communities/${category}/join`, {
      method: isJoined ? "DELETE" : "POST",
    });
    setLoading(null);
    if (res.ok) {
      setJoined((prev) => {
        const next = new Set(prev);
        if (isJoined) next.delete(category);
        else next.add(category);
        return next;
      });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Discover</h1>
      <p className="text-zinc-400">Join a community for your goal type.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {communities.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-zinc-800 p-4 flex flex-col gap-3"
          >
            <div className="capitalize">
              <p className="font-semibold text-lg">{c.category}</p>
              <p className="text-sm text-zinc-500">{c.memberCount} members</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading === c.category}
                onClick={() => toggleJoin(c.category as GoalCategory)}
                className="flex-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 py-2 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {joined.has(c.category) ? "Joined" : "Join"}
              </button>
              <Link
                href={`/discover/${c.category}`}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900"
              >
                Feed
              </Link>
            </div>
          </div>
        ))}
      </div>
      {communities.length === 0 &&
        GOAL_CATEGORIES.map((cat) => (
          <p key={cat} className="text-zinc-600 text-sm capitalize">
            {cat}
          </p>
        ))}
    </div>
  );
}
