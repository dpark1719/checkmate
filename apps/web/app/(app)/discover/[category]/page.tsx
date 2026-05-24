"use client";

import { FeedPostCard } from "@/components/FeedPostCard";
import { goalCategorySchema } from "@goalpost/shared";
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
  const valid = goalCategorySchema.safeParse(category).success;

  useEffect(() => {
    if (!valid) return;
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
      {posts.length === 0 ? (
        <p className="text-zinc-500">No posts in this community yet.</p>
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
