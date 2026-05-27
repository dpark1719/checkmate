"use client";

import { FeedPostCard } from "@/components/FeedPostCard";
import Link from "next/link";
import { useEffect, useState } from "react";

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
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/me/feed")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <Link href="/post" className="text-sm text-accent hover:underline">
          Post today →
        </Link>
      </div>

      {loading ? (
        <p className="gp-text-muted">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--gp-border)] p-12 text-center space-y-4">
          <p className="gp-text-muted">
            Your feed is empty. Follow people or join a community in Discover.
          </p>
          <Link
            href="/discover"
            className="inline-block text-accent hover:underline"
          >
            Discover communities
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              openMessagingOnClick
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
