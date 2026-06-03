"use client";

import {
  PostThumbnailGrid,
  type ThumbnailPost,
} from "@/components/PostThumbnailGrid";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface GoalInfo {
  id: string;
  title: string;
  category: string;
}

export default function GoalPostsPage() {
  const params = useParams();
  const goalId = params.id as string;
  const [goal, setGoal] = useState<GoalInfo | null>(null);
  const [posts, setPosts] = useState<ThumbnailPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/goals/${goalId}/posts`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setGoal(null);
          setPosts([]);
          return;
        }
        setGoal(data.goal ?? null);
        setPosts(data.posts ?? []);
      })
      .catch(() => setError("Could not load posts"))
      .finally(() => setLoading(false));
  }, [goalId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/goals" className="gp-btn-text">
          ← Back to goals
        </Link>
      </div>

      {loading ? (
        <p className="gp-text-muted">Loading…</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : goal ? (
        <>
          <header className="space-y-1">
            <h1 className="text-2xl font-bold">{goal.title}</h1>
            <p className="text-sm gp-text-muted capitalize">
              {goal.category} · {posts.length}{" "}
              {posts.length === 1 ? "check-in" : "check-ins"}
            </p>
          </header>

          {posts.length === 0 ? (
            <p className="gp-text-muted text-sm">
              No check-ins for this goal yet. Post from the Post tab.
            </p>
          ) : (
            <PostThumbnailGrid posts={posts} onPostUpdated={() => load()} />
          )}
        </>
      ) : null}
    </div>
  );
}
