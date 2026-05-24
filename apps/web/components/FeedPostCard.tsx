"use client";

import { CommentsSection } from "@/components/CommentsSection";
import { REACTION_TYPES, type ReactionType } from "@goalpost/shared";
import Link from "next/link";
import { useState } from "react";

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

export function FeedPostCard({ post }: { post: FeedPost }) {
  const [reactions, setReactions] = useState(post.reactions);
  const [following, setFollowing] = useState(false);

  async function toggleReaction(type: ReactionType) {
    const has = reactions.some((r) => r.type === type);
    const res = await fetch(
      `/api/posts/${post.id}/reactions${has ? `?type=${type}` : ""}`,
      {
        method: has ? "DELETE" : "POST",
        headers: has ? undefined : { "Content-Type": "application/json" },
        body: has ? undefined : JSON.stringify({ type }),
      }
    );
    if (res.ok) {
      setReactions((prev) =>
        has ? prev.filter((r) => r.type !== type) : [...prev, { type, user_id: "me" }]
      );
    }
  }

  async function reportPost() {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "post",
        targetId: post.id,
        reason,
      }),
    });
  }

  async function followAuthor() {
    const res = await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: post.userId }),
    });
    if (res.ok) setFollowing(true);
  }

  return (
    <article className="rounded-xl border border-zinc-800 overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-2">
        <div>
          <Link
            href={`/u/${post.author?.username}`}
            className="font-semibold hover:underline"
          >
            {post.author?.displayName ?? "User"}
          </Link>
          <p className="text-xs text-zinc-500">
            @{post.author?.username} · {post.goal?.title}
            {post.isLate && (
              <span className="ml-2 text-amber-500">Late</span>
            )}
          </p>
        </div>
        {!following && (
          <button
            type="button"
            onClick={followAuthor}
            className="text-xs rounded-full border border-zinc-600 px-3 py-1 hover:bg-zinc-900"
          >
            Follow
          </button>
        )}
      </div>
      <img src={post.photoUrl} alt="" className="w-full aspect-square object-cover bg-zinc-900" />
      {post.caption && <p className="px-4 py-2 text-sm">{post.caption}</p>}
      <div className="px-4 pb-2 flex gap-2 flex-wrap items-center">
        {REACTION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleReaction(type)}
            className={`text-xs rounded-full px-3 py-1 border ${
              reactions.some((r) => r.type === type)
                ? "border-emerald-500 text-emerald-400"
                : "border-zinc-700 text-zinc-400"
            }`}
          >
            {type}
          </button>
        ))}
        <button
          type="button"
          onClick={reportPost}
          className="text-xs text-zinc-600 hover:text-zinc-400 ml-auto"
        >
          Report
        </button>
      </div>
      <CommentsSection postId={post.id} />
    </article>
  );
}
