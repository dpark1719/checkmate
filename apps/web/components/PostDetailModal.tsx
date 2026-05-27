"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PostAuthor {
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface PostDetailModalProps {
  post: {
    id: string;
    userId: string;
    photoUrl: string;
    caption: string | null;
    isLate: boolean;
    author: PostAuthor | null;
    goal: { title: string; category: string } | null;
  };
  currentUserId: string | null;
  onClose: () => void;
}

export function PostDetailModal({
  post,
  currentUserId,
  onClose,
}: PostDetailModalProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUserId === post.userId;

  async function startMessage() {
    setError(null);
    setStarting(true);
    const res = await fetch(`/api/conversations/from-post/${post.id}`, {
      method: "POST",
    });
    const data = await res.json();
    setStarting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not start conversation");
      return;
    }
    onClose();
    router.push(`/messages/${data.conversationId}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--gp-border)] bg-[var(--background)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between gap-2 border-b border-[var(--gp-border)]">
          <div className="min-w-0">
            <Link
              href={`/u/${post.author?.username}`}
              className="font-semibold hover:underline truncate block"
            >
              {post.author?.displayName ?? "User"}
            </Link>
            <p className="text-xs gp-text-muted truncate">
              @{post.author?.username}
              {post.goal?.title ? ` · ${post.goal.title}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="gp-text-muted hover:text-[var(--gp-fg)] px-2 py-1 text-sm"
          >
            Close
          </button>
        </div>
        <img
          src={post.photoUrl}
          alt=""
          className="w-full aspect-square object-cover bg-[var(--gp-card)]"
        />
        {post.caption && (
          <p className="px-4 py-3 text-sm text-[var(--gp-fg)]">{post.caption}</p>
        )}
        <div className="p-4 border-t border-[var(--gp-border)] space-y-3">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {isOwner ? (
            <p className="text-sm gp-text-muted">This is your post.</p>
          ) : (
            <button
              type="button"
              onClick={startMessage}
              disabled={starting || !currentUserId}
              className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 disabled:opacity-50"
            >
              {starting ? "Opening chat…" : "Message about this post"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
