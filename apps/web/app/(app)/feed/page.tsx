"use client";

import { FeedPostCard } from "@/components/FeedPostCard";
import { groupPostsByDay } from "@/lib/format-datetime";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FeedPost {
  id: string;
  userId: string;
  photoUrl: string;
  caption: string | null;
  isLate: boolean;
  createdAt: string;
  author: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  goal: { title: string; category: string } | null;
  reactions: { type: string; user_id: string }[];
  isFollowingAuthor?: boolean;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ limit: "20" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/users/me/feed?${params}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error ?? "Could not load feed");
    }
    return {
      posts: (data.posts ?? []) as FeedPost[],
      nextCursor: (data.nextCursor as string | null) ?? null,
    };
  }, []);

  useEffect(() => {
    loadFeed()
      .then(({ posts: fetched, nextCursor: cursor }) => {
        setPosts(fetched);
        setNextCursor(cursor);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not load feed");
        setLoading(false);
      });
  }, [loadFeed]);

  const dayGroups = useMemo(() => groupPostsByDay(posts), [posts]);

  async function loadEarlier() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { posts: more, nextCursor: cursor } = await loadFeed(nextCursor);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const post of more) {
          if (!seen.has(post.id)) merged.push(post);
        }
        return merged;
      });
      setNextCursor(cursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <Link href="/post" className="gp-btn-text">
          Post today →
        </Link>
      </div>

      {loading ? (
        <p className="gp-text-muted">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--gp-border)] p-12 text-center space-y-4">
          <p className="gp-text-muted">
            Your feed is empty. Follow people or join a community in Discover.
          </p>
          <Link href="/discover" className="gp-btn-text">
            Discover communities
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {dayGroups.map((group) => (
            <section key={group.dayKey} className="space-y-4">
              <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--gp-border)]">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold tracking-wide text-[var(--gp-muted)]">
                    {group.weekday}
                  </h2>
                  <span className="text-sm text-[var(--gp-subtle)] shrink-0">
                    {group.date}
                  </span>
                </div>
              </div>
              <div className="space-y-6">
                {group.posts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    openMessagingOnClick
                    onDeleted={(id) =>
                      setPosts((prev) => prev.filter((p) => p.id !== id))
                    }
                  />
                ))}
              </div>
            </section>
          ))}

          {nextCursor && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                type="button"
                onClick={() => void loadEarlier()}
                disabled={loadingMore}
                className="rounded-lg border border-[var(--gp-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--gp-card)] disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load earlier posts"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
