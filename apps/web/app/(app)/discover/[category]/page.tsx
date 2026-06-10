"use client";

import { DiscoverPostGrid } from "@/components/DiscoverPostGrid";
import { Skeleton } from "@/components/motion/Skeleton";
import { goalCategorySchema } from "@checkmate/shared";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

interface FeedStatus {
  joined: boolean;
  sharedGoal: { id: string; title: string; category: string } | null;
  yourPostsInThisCommunity: { postId: string; goalTitle: string }[];
  willShowInFeed: boolean;
  hint: string;
}

export default function CommunityFeedPage() {
  const params = useParams();
  const category = params.category as string;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [status, setStatus] = useState<FeedStatus | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const valid = goalCategorySchema.safeParse(category).success;

  const load = useCallback(() => {
    if (!valid) return;
    setLoading(true);
    setFeedError(null);

    Promise.all([
      fetch(`/api/communities/${category}/feed`).then((r) => r.json()),
      fetch(`/api/communities/${category}/status`).then((r) => r.json()),
    ])
      .then(([feedData, statusData]) => {
        if (feedData.error) {
          setFeedError(feedData.error);
          setPosts([]);
        } else {
          setPosts(feedData.posts ?? []);
        }
        if (!statusData.error) {
          setStatus(statusData);
        }
        setLoading(false);
      })
      .catch(() => {
        setFeedError("Could not load feed");
        setLoading(false);
      });
  }, [category, valid]);

  useEffect(() => {
    load();
  }, [load]);

  if (!valid) {
    return <p className="text-red-400">Invalid category</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold capitalize">{category}</h1>
        <button
          type="button"
          onClick={load}
          className="gp-btn-text"
        >
          Refresh
        </button>
      </div>

      {status && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.willShowInFeed
              ? "border-accent/40 bg-[var(--gp-accent-subtle)] text-[var(--gp-fg)]"
              : "border-amber-500/30 bg-amber-500/5 text-[var(--gp-fg)]"
          }`}
        >
          <p>{status.hint}</p>
          {status.sharedGoal && (
            <p className="gp-text-muted mt-1">
              Sharing: <span className="text-accent">{status.sharedGoal.title}</span>
            </p>
          )}
          {status.yourPostsInThisCommunity.length > 0 && (
            <p className="gp-text-muted mt-1">
              You have {status.yourPostsInThisCommunity.length} post(s) in this
              community category.
            </p>
          )}
          {!status.joined && (
            <Link href="/discover" className="gp-btn-text mt-2">
              Join on Discover →
            </Link>
          )}
        </div>
      )}

      {feedError && <p className="text-red-400 text-sm">{feedError}</p>}

      {loading ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="gp-text-muted text-sm space-y-2">
          <p>No posts in this feed yet.</p>
          <ul className="list-disc list-inside gp-text-subtle space-y-1">
            <li>
              <Link href="/discover" className="gp-btn-text">
                Join
              </Link>{" "}
              the community and pick a goal
            </li>
            <li>
              <Link href="/post" className="gp-btn-text">
                Post
              </Link>{" "}
              a photo for a <span className="capitalize">{category}</span> goal
            </li>
            <li>Tap Refresh after posting</li>
          </ul>
        </div>
      ) : (
        <DiscoverPostGrid posts={posts} />
      )}
    </div>
  );
}
