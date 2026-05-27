"use client";

import { UserAvatar } from "@/components/UserAvatar";
import { compressImageForUpload } from "@/lib/compress-image";
import { useEffect, useRef, useState } from "react";

export function AvatarUpload({
  displayName,
  avatarUrl,
  onUpdated,
}: {
  displayName: string;
  avatarUrl: string | null;
  onUpdated: (avatarUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImageForUpload(file, {
        maxBytes: 256 * 1024,
        maxDimension: 512,
      });
      const form = new FormData();
      form.append("file", compressed);

      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      const url = data.avatarUrl as string;
      setPreview(url);
      onUpdated(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process photo");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    if (!preview) return;
    if (!window.confirm("Remove your profile photo?")) return;
    setUploading(true);
    setError(null);
    const res = await fetch("/api/upload/avatar", { method: "DELETE" });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not remove photo");
      return;
    }
    setPreview(null);
    onUpdated(null);
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <UserAvatar
        displayName={displayName}
        avatarUrl={preview}
        size="lg"
      />
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-accent text-accent-foreground font-semibold px-4 py-2 text-sm disabled:opacity-50"
          >
            {uploading ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
          </button>
          {preview && (
            <button
              type="button"
              disabled={uploading}
              onClick={removePhoto}
              className="rounded-lg border border-[var(--gp-border)] px-4 py-2 text-sm hover:bg-[var(--gp-surface)] disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs gp-text-muted max-w-xs">
          Square photos work best. We resize to 512px and compress before upload.
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
