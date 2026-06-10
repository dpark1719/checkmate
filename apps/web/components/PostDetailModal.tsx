"use client";

import { CommentsSection } from "@/components/CommentsSection";
import { AnimatedModalRoot } from "@/components/motion/MotionModal";
import { PostReactionButton } from "@/components/PostReactionButton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { compressImageForUpload } from "@/lib/compress-image";
import { formatPostDateTime } from "@/lib/format-datetime";
import {
  type ReactionRow,
  reactionMatches,
  userHasReaction,
} from "@/lib/reactions";
import { REACTION_TYPES, type ReactionType } from "@checkmate/shared";

export interface PostAuthor {
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface ThumbnailPost {
  id: string;
  userId: string;
  photoUrl: string;
  caption: string | null;
  isLate: boolean;
  createdAt: string;
  author: PostAuthor | null;
  goal: { title: string; category: string } | null;
}

interface PostDetailModalProps {
  post: ThumbnailPost;
  currentUserId: string | null;
  canModeratePosts?: boolean;
  onClose: () => void;
  onUpdated?: (post: ThumbnailPost) => void;
  onRemoved?: () => void;
}

export function PostDetailModal({
  post,
  currentUserId,
  canModeratePosts = false,
  onClose,
  onUpdated,
  onRemoved,
}: PostDetailModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState(post.caption ?? "");
  const [photoUrl, setPhotoUrl] = useState(post.photoUrl);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [removing, setRemoving] = useState(false);

  const isOwner = currentUserId === post.userId;

  useEffect(() => {
    let cancelled = false;

    async function loadReactions() {
      const res = await fetch(`/api/posts/${post.id}`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      const loaded = (data.post?.reactions ?? []) as ReactionRow[];
      if (!cancelled) setReactions(loaded);
    }

    void loadReactions();
    return () => {
      cancelled = true;
    };
  }, [post.id]);

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

  useEffect(() => {
    setCaption(post.caption ?? "");
    setPhotoUrl(post.photoUrl);
    setPhotoPath(null);
    setEditing(false);
  }, [post]);

  function resetEditState() {
    setCaption(post.caption ?? "");
    setPhotoUrl(post.photoUrl);
    setPhotoPath(null);
    setEditing(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImageForUpload(file);
      const form = new FormData();
      form.append("file", compressed);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      setUploading(false);

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setPhotoPath(data.path);
      setPhotoUrl(data.signedUrl);
    } catch (e) {
      setUploading(false);
      setError(e instanceof Error ? e.message : "Could not process photo");
    }
  }

  async function removePost() {
    if (
      !window.confirm(
        "Remove this post from feeds? This moderation action cannot be undone by the author."
      )
    ) {
      return;
    }

    setRemoving(true);
    setError(null);
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setRemoving(false);

    if (!res.ok) {
      setError(
        (data as { error?: string }).error ?? "Could not remove post. Try again."
      );
      return;
    }

    onRemoved?.();
    onClose();
  }

  async function saveEdit() {
    setSaving(true);
    setError(null);

    const body: { caption?: string | null; photoUrl?: string } = {
      caption: caption.trim() ? caption.trim() : null,
    };
    if (photoPath) body.photoUrl = photoPath;

    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save changes");
      return;
    }

    const updated = data.post as ThumbnailPost;
    setPhotoUrl(updated.photoUrl);
    setCaption(updated.caption ?? "");
    setPhotoPath(null);
    setEditing(false);
    onUpdated?.(updated);
  }

  return (
    <AnimatedModalRoot
      onClose={onClose}
      align="bottom"
      panelClassName="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--gp-border)] bg-[var(--background)]"
    >
        <div className="p-4 flex items-center justify-between gap-2 border-b border-[var(--gp-border)]">
          <div className="min-w-0">
            <Link
              href={`/u/${post.author?.username}`}
              className="block truncate text-base font-bold text-[var(--gp-fg)] hover:text-accent transition-colors"
            >
              {post.author?.displayName ?? "User"}
            </Link>
            {post.goal?.title && (
              <p className="text-xs gp-text-muted truncate">{post.goal.title}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="gp-btn-text-neutral gp-btn-text-xs shrink-0"
          >
            Close
          </button>
        </div>

        {editing ? (
          <div className="space-y-3 p-4">
            <img
              src={photoUrl}
              alt=""
              className="w-full aspect-square object-cover rounded-lg bg-[var(--gp-card)]"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gp-btn-text gp-btn-text-xs disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Change photo"}
            </button>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Caption (optional)"
              className="gp-input w-full resize-none"
            />
            <p className="text-xs gp-text-muted text-right">{caption.length}/280</p>
          </div>
        ) : (
          <>
            <img
              src={photoUrl}
              alt=""
              className="w-full aspect-square object-cover bg-[var(--gp-card)]"
            />
            <p className="px-4 pt-3 text-xs gp-text-muted">
              {formatPostDateTime(post.createdAt)}
            </p>
            {caption && (
              <p className="px-4 py-2 text-sm text-[var(--gp-fg)]">{caption}</p>
            )}
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
            </div>
          </>
        )}

        {!editing && <CommentsSection postId={post.id} />}

        <div className="p-4 border-t border-[var(--gp-border)] space-y-3">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {isOwner ? (
            editing ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={saving || uploading}
                  className="flex-1 rounded-lg bg-accent text-accent-foreground font-semibold py-2 text-sm disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetEditState}
                  disabled={saving || uploading}
                  className="flex-1 rounded-lg border border-[var(--gp-border)] py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full rounded-lg border border-[var(--gp-border)] py-2 text-sm font-medium hover:bg-[var(--gp-surface)]"
              >
                Edit post
              </button>
            )
          ) : (
            <div className="space-y-2">
              {canModeratePosts && (
                <button
                  type="button"
                  onClick={() => void removePost()}
                  disabled={removing}
                  className="w-full rounded-lg border border-red-500/40 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {removing ? "Removing…" : "Remove post"}
                </button>
              )}
              <button
                type="button"
                onClick={startMessage}
                disabled={starting || !currentUserId}
                className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 disabled:opacity-50"
              >
                {starting ? "Opening chat…" : "Message about this post"}
              </button>
            </div>
          )}
        </div>
    </AnimatedModalRoot>
  );
}
