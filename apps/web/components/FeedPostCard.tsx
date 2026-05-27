"use client";

import { CommentsSection } from "@/components/CommentsSection";
import {
  REACTION_TYPES,
  reactionEmoji,
  type ReactionType,
} from "@goalpost/shared";
import { PostDetailModal } from "@/components/PostDetailModal";
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

function reactionMatches(type: ReactionType, stored: string) {
  if (stored === type) return true;
  if (type === "cheers" && stored === "mind_blown") return true;
  return false;
}

export function FeedPostCard({
  post,
  onDeleted,
  openMessagingOnClick = false,
}: {
  post: FeedPost;
  onDeleted?: (postId: string) => void;
  /** Community feed: tap post to view and message author */
  openMessagingOnClick?: boolean;
}) {
  const [reactions, setReactions] = useState(post.reactions);
  const [following, setFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const isOwner = currentUserId === post.userId;

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.userId) setCurrentUserId(data.userId);
        else if (data.profile?.id) setCurrentUserId(data.profile.id);
      })
      .catch(() => {});
  }, []);

  async function toggleReaction(type: ReactionType) {
    const has = reactions.some((r) => reactionMatches(type, r.type));
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
        has
          ? prev.filter((r) => !reactionMatches(type, r.type))
          : [...prev, { type, user_id: "me" }]
      );
    }
  }

  async function deletePost() {
    if (
      !window.confirm(
        "Delete this post? It will be removed from feeds. Your streak for this day may still count."
      )
    ) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (res.ok) {
      setRemoved(true);
      onDeleted?.(post.id);
      return;
    }
    setDeleteError(
      (data as { error?: string }).error ??
        (res.status === 401
          ? "Please log in again to delete this post."
          : "Could not delete post. Try again.")
    );
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

  if (removed) return null;

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
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <button
              type="button"
              onClick={deletePost}
              disabled={deleting}
              className="text-xs text-red-400 hover:underline disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          {!isOwner && !following && (
            <button
              type="button"
              onClick={followAuthor}
              className="text-xs rounded-full border border-zinc-600 px-3 py-1 hover:bg-zinc-900"
            >
              Follow
            </button>
          )}
        </div>
      </div>
      {deleteError && (
        <p className="px-4 pb-2 text-xs text-red-400">{deleteError}</p>
      )}
      {openMessagingOnClick ? (
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="block w-full text-left"
          aria-label="View post and message"
        >
          <img
            src={post.photoUrl}
            alt=""
            className="w-full aspect-square object-cover bg-zinc-900"
          />
        </button>
      ) : (
        <img
          src={post.photoUrl}
          alt=""
          className="w-full aspect-square object-cover bg-zinc-900"
        />
      )}
      {post.caption &&
        (openMessagingOnClick ? (
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="px-4 py-2 text-sm w-full text-left hover:bg-[var(--gp-surface)]"
          >
            {post.caption}
          </button>
        ) : (
          <p className="px-4 py-2 text-sm">{post.caption}</p>
        ))}
      <div className="px-4 pb-2 flex gap-2 flex-wrap items-center">
        {REACTION_TYPES.map((type) => {
          const active = reactions.some((r) => reactionMatches(type, r.type));
          const count = reactions.filter((r) => reactionMatches(type, r.type)).length;
          return (
            <button
              key={type}
              type="button"
              title={type}
              aria-label={type}
              onClick={() => toggleReaction(type)}
              className={`text-xl rounded-full min-w-[2.5rem] h-10 px-2 border flex items-center justify-center gap-1 ${
                active
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-zinc-700 opacity-80 hover:opacity-100"
              }`}
            >
              <span aria-hidden>{reactionEmoji(type)}</span>
              {count > 0 && (
                <span className="text-xs text-zinc-400 tabular-nums">{count}</span>
              )}
            </button>
          );
        })}
        {!isOwner && (
          <button
            type="button"
            onClick={reportPost}
            className="text-xs text-zinc-600 hover:text-zinc-400 ml-auto"
          >
            Report
          </button>
        )}
      </div>
      <CommentsSection postId={post.id} />
      {detailOpen && (
        <PostDetailModal
          post={post}
          currentUserId={currentUserId}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </article>
  );
}
