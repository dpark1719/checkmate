"use client";

import { CommentsSection } from "@/components/CommentsSection";
import { PostReactionButton } from "@/components/PostReactionButton";
import { UserAvatar } from "@/components/UserAvatar";
import { REACTION_TYPES, type ReactionType } from "@checkmate/shared";
import {
  type ReactionRow,
  reactionMatches,
  userHasReaction,
} from "@/lib/reactions";
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
  reactions: ReactionRow[];
  isFollowingAuthor?: boolean;
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
  const [connected, setConnected] = useState(post.isFollowingAuthor ?? false);
  const [connecting, setConnecting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const isOwner = currentUserId === post.userId;

  useEffect(() => {
    setConnected(post.isFollowingAuthor ?? false);
  }, [post.isFollowingAuthor]);

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
    if (!currentUserId) return;

    const has = userHasReaction(reactions, type, currentUserId);
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
          ? prev.filter(
              (r) =>
                !(
                  r.user_id === currentUserId &&
                  reactionMatches(type, r.type)
                )
            )
          : [...prev, { type, user_id: currentUserId }]
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

  async function connectAuthor() {
    setConnecting(true);
    const res = await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: post.userId }),
    });
    setConnecting(false);
    if (res.ok) setConnected(true);
  }

  async function disconnectAuthor() {
    setConnecting(true);
    const res = await fetch(`/api/follows/${post.userId}`, { method: "DELETE" });
    setConnecting(false);
    if (res.ok) setConnected(false);
  }

  if (removed) return null;

  return (
    <article className="rounded-xl border border-[var(--gp-border)] overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {post.author && (
            <Link href={`/u/${post.author.username}`} className="shrink-0">
              <UserAvatar
                displayName={post.author.displayName}
                avatarUrl={post.author.avatarUrl}
                size="sm"
              />
            </Link>
          )}
          <div className="min-w-0">
            <Link
              href={`/u/${post.author?.username}`}
              className="block truncate text-base font-bold text-[var(--gp-fg)] hover:text-accent transition-colors"
            >
              {post.author?.displayName ?? "User"}
            </Link>
            <p className="text-xs gp-text-muted truncate">
              {post.goal?.title}
              {post.isLate && (
                <span className="ml-2 text-amber-500">Late</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <button
              type="button"
              onClick={deletePost}
              disabled={deleting}
              className="gp-btn-text-danger gp-btn-text-xs shrink-0"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          {!isOwner && (
            connected ? (
              <button
                type="button"
                onClick={() => void disconnectAuthor()}
                disabled={connecting}
                className="gp-btn-text-neutral gp-btn-text-xs shrink-0 disabled:opacity-50"
              >
                {connecting ? "…" : "Connected"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void connectAuthor()}
                disabled={connecting}
                className="gp-btn-text gp-btn-text-xs shrink-0 disabled:opacity-50"
              >
                {connecting ? "Connecting…" : "Connect"}
              </button>
            )
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
            className="w-full aspect-square object-cover bg-[var(--gp-card)]"
          />
        </button>
      ) : (
        <img
          src={post.photoUrl}
          alt=""
          className="w-full aspect-square object-cover bg-[var(--gp-card)]"
        />
      )}
      {post.caption &&
        (openMessagingOnClick ? (
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="px-4 py-2 text-sm w-full text-left gp-btn-text-neutral gp-btn-text-block rounded-none border-x-0 border-b-0"
          >
            {post.caption}
          </button>
        ) : (
          <p className="px-4 py-2 text-sm">{post.caption}</p>
        ))}
      <div className="px-4 pb-2 flex gap-2 flex-wrap items-center">
        {REACTION_TYPES.map((type) => (
          <PostReactionButton
            key={type}
            postId={post.id}
            type={type}
            reactions={reactions}
            currentUserId={currentUserId}
            onToggle={toggleReaction}
          />
        ))}
        {!isOwner && (
          <button
            type="button"
            onClick={reportPost}
            className="gp-btn-text-neutral gp-btn-text-xs ml-auto shrink-0"
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
