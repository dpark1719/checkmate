"use client";

import { PromiseCountdown } from "@/components/PromiseCountdown";
import { useEffect, useState } from "react";

interface Challenge {
  id: string;
  goalId: string;
  triggerFiredAt: string | null;
  promiseTime: string | null;
  leewayExpiresAt: string | null;
  postedAt: string | null;
  postId?: string;
  goals?: { title: string; category: string };
}

export function PostChallengeCard({
  challenge,
  onPosted,
}: {
  challenge: Challenge;
  onPosted: () => void;
}) {
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

  const title = challenge.goals?.title ?? "Goal";
  const done = Boolean(challenge.postedAt);
  const canDelete = Boolean(postedPostId);

  useEffect(() => {
    if (challenge.postId) setPostedPostId(challenge.postId);
  }, [challenge.postId]);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    setPhotoPath(data.path);
    setPreview(data.signedUrl);
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
    onPosted();
  }

  async function deletePost() {
    if (!postedPostId) return;
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/posts/${postedPostId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not delete");
      return;
    }
    setPostedPostId(null);
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
    <li className="rounded-xl border border-zinc-800 p-4 space-y-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-zinc-500 capitalize">{challenge.goals?.category}</p>
      </div>

      {!done && (
        <PromiseCountdown expiresAt={challenge.leewayExpiresAt} />
      )}

      {!done && challenge.triggerFiredAt && (
        <div>
          <label className="text-sm text-zinc-400 block mb-1">Promise time today</label>
          <input
            type="datetime-local"
            defaultValue={
              challenge.promiseTime
                ? new Date(challenge.promiseTime).toISOString().slice(0, 16)
                : undefined
            }
            onChange={(e) => updatePromiseTime(e.target.value)}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
          />
        </div>
      )}

      {done ? (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-emerald-400 text-sm font-medium">Posted ✓</p>
          {canDelete ? (
            <button
              type="button"
              onClick={deletePost}
              disabled={deleting}
              className="text-sm text-red-400 hover:underline disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete post"}
            </button>
          ) : (
            <p className="text-xs text-zinc-500">Refresh page to delete this post</p>
          )}
        </div>
      ) : (
        <>
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="rounded-lg w-full max-h-64 object-cover"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="text-sm text-zinc-400"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            maxLength={280}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm min-h-[72px]"
          />
          <button
            type="button"
            disabled={uploading || posting || !photoPath}
            onClick={submitPost}
            className="w-full rounded-lg bg-emerald-500 text-zinc-950 font-semibold py-2.5 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : posting ? "Posting…" : "Post"}
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </li>
  );
}
