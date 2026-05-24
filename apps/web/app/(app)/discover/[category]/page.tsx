"use client";

import { FeedPostCard } from "@/components/FeedPostCard";
import { goalCategorySchema } from "@goalpost/shared";
import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function CommunityFeedPage() {
  const params = useParams();
  const category = params.category as string;
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [mySharedGoal, setMySharedGoal] = useState<string | null>(null);
  const valid = goalCategorySchema.safeParse(category).success;

  useEffect(() => {
    if (!valid) return;
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data) => {
        const m = (data.myMemberships ?? []).find(
          (x: { category: string }) => x.category === category
        );
        setMySharedGoal(m?.sharedGoalTitle ?? null);
      });
    fetch(`/api/communities/${category}/feed`)
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []));
  }, [category, valid]);

  if (!valid) {
    return <p className="text-red-400">Invalid category</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold capitalize">{category}</h1>
      {mySharedGoal ? (
        <p className="text-sm text-zinc-500">
          Showing posts for goals members chose to share, including your{" "}
          <span className="text-emerald-400">{mySharedGoal}</span>.
        </p>
      ) : (
        <p className="text-sm text-amber-400/90">
          Join this community and pick a goal to share — your posts only appear
          here when they match that goal.{" "}
          <Link href="/discover" className="underline text-emerald-400">
            Join on Discover
          </Link>
        </p>
      )}
      {posts.length === 0 ? (
        <div className="text-zinc-500 text-sm space-y-2">
          <p>No posts in this feed yet.</p>
          <ul className="list-disc list-inside text-zinc-600 space-y-1">
            <li>Join and pick a goal via Discover → Join / Change goal</li>
            <li>Post a photo for that same goal (Post tab, today&apos;s challenge)</li>
            <li>
              The goal category must match this community (
              <span className="capitalize">{category}</span>)
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
