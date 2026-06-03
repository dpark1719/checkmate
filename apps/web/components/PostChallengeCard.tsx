"use client";

import { PromiseCountdown } from "@/components/PromiseCountdown";
import { compressImageForUpload } from "@/lib/compress-image";
import { formatDefaultPromiseTime } from "@/lib/goal-titles";
import { useEffect, useRef, useState } from "react";

interface Challenge {
  id: string;
  goalId: string;
  triggerFiredAt: string | null;
  promiseTime: string | null;
  leewayExpiresAt: string | null;
  postedAt: string | null;
  postId?: string;
  goals?: {
    title: string;
    category: string;
    defaultPromiseTime?: string;
    default_promise_time?: string;
  };
}

function resetUploadState(setters: {
  setPreview: (v: string | null) => void;
  setPhotoPath: (v: string | null) => void;
  setCaption: (v: string) => void;
}) {
  setters.setPreview(null);
  setters.setPhotoPath(null);
  setters.setCaption("");
}

export function PostChallengeCard({
  challenge,
  onPosted,
  duplicateTitle = false,
}: {
  challenge: Challenge;
  onPosted: () => void;
  duplicateTitle?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [postedPostId, setPostedPostId] = useState<string | null>(
    challenge.postId ?? null
  );
  const [deleting, setDeleting] = useState(false);
  /** After delete, ignore stale postedAt until parent reloads */
  const [dismissedPosted, setDismissedPosted] = useState(false);

  const title = challenge.goals?.title ?? "Goal";
  const defaultTime =
    challenge.goals?.defaultPromiseTime ??
    challenge.goals?.default_promise_time;
  const done = Boolean(challenge.postedAt) && !dismissedPosted;

  useEffect(() => {
    if (!challenge.postedAt) {
      setDismissedPosted(false);
    }
    if (challenge.postId) setPostedPostId(challenge.postId);
  }, [challenge.postedAt, challenge.postId]);

  useEffect(() => {
    if (!done || postedPostId || challenge.postId) return;
    fetch("/api/challenges/today")
      .then((r) => r.json())
      .then((d) => {
        const match = (d.challenges ?? []).find(
          (c: { id: string; postId?: string }) => c.id === challenge.id
        );
        if (match?.postId) setPostedPostId(match.postId);
      })
      .catch(() => {});
  }, [done, postedPostId, challenge.postId, challenge.id]);

  async function resolvePostId(): Promise<string | null> {
    if (postedPostId) return postedPostId;
    if (challenge.postId) return challenge.postId;
    const res = await fetch("/api/challenges/today");
    const data = await res.json();
    const match = (data.challenges ?? []).find(
      (c: { id: string; postId?: string }) => c.id === challenge.id
    );
    const id = (match?.postId as string | undefined) ?? null;
    if (id) setPostedPostId(id);
    return id;
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
      setPreview(data.signedUrl);
    } catch (e) {
      setUploading(false);
      setError(e instanceof Error ? e.message : "Could not process photo");
    }
  }

  async function submitPost() {
    if (!photoPath) {
      setError("Add a photo first");
      return;
    }
    setPosting(true);
    setError(null);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId: challenge.goalId,
        dailyChallengeId: challenge.id,
        photoUrl: photoPath,
        caption: caption || undefined,
      }),
    });
    const data = await res.json();
    setPosting(false);

    if (!res.ok) {
      setError(data.error ?? "Post failed");
      return;
    }
    const postId = data.post?.id as string | undefined;
    if (postId) setPostedPostId(postId);
    setDismissedPosted(false);
    onPosted();
  }

  async function deletePost() {
    const id = await resolvePostId();
    if (!id) {
      setError("Could not delete yet. Try again in a moment.");
      return;
    }
    if (!window.confirm("Delete this post? You can upload a new one after.")) {
      return;
    }
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not delete");
      return;
    }
    setPostedPostId(null);
    setDismissedPosted(true);
    resetUploadState({ setPreview, setPhotoPath, setCaption });
    if (fileInputRef.current) fileInputRef.current.value = "";
    onPosted();
  }

  async function updatePromiseTime(value: string) {
    const iso = new Date(value).toISOString();
    await fetch(`/api/challenges/${challenge.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promiseTime: iso }),
    });
    onPosted();
  }

  return (
    <li className="rounded-xl border border-[var(--gp-border)] p-4 space-y-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm gp-text-muted capitalize">
          {challenge.goals?.category}
          {defaultTime
            ? ` · Default ${formatDefaultPromiseTime(defaultTime)}`
            : null}
        </p>
        {duplicateTitle && (
          <p className="text-xs text-amber-500 mt-1">
            Duplicate goal — you have another active goal with this name. Remove
            one on the Goals tab.
          </p>
        )}
      </div>

      {!done && <PromiseCountdown expiresAt={challenge.leewayExpiresAt} />}

      {!done && challenge.triggerFiredAt && (
        <div>
          <label className="text-sm gp-text-muted block mb-1">
            Promise time today
          </label>
          <input
            type="datetime-local"
            defaultValue={
              challenge.promiseTime
                ? new Date(challenge.promiseTime).toISOString().slice(0, 16)
                : undefined
            }
            onChange={(e) => updatePromiseTime(e.target.value)}
            className="w-full rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-3 py-2 text-sm"
          />
        </div>
      )}

      {done ? (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-accent text-sm font-medium">Posted ✓</p>
          <button
            type="button"
            onClick={deletePost}
            disabled={deleting}
            className="gp-btn-text-danger gp-btn-text-xs disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete post"}
          </button>
        </div>
      ) : (
        <>
          {preview && (
            <div className="relative rounded-lg overflow-hidden border border-[var(--gp-border)]">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-cover"
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {uploading
              ? "Uploading…"
              : preview
                ? "Change photo"
                : "Choose photo"}
          </button>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            maxLength={280}
            className="w-full rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-3 py-2 text-sm min-h-[72px]"
          />
          <button
            type="button"
            disabled={uploading || posting || !photoPath}
            onClick={submitPost}
            className="w-full rounded-lg border-2 border-accent text-accent font-semibold py-2.5 hover:bg-[var(--gp-accent-subtle)] disabled:opacity-50 disabled:border-[var(--gp-border)] disabled:text-[var(--gp-muted)]"
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </li>
  );
}
