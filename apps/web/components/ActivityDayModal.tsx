"use client";

import { AnimatedModalRoot } from "@/components/motion/MotionModal";
import { PostThumbnailGrid, type ThumbnailPost } from "@/components/PostThumbnailGrid";
import { useEffect, useState } from "react";

function formatModalDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityDayModal({
  username,
  date,
  onClose,
}: {
  username: string;
  date: string;
  onClose: () => void;
}) {
  const [posts, setPosts] = useState<ThumbnailPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/users/${encodeURIComponent(username)}/posts?date=${encodeURIComponent(date)}&limit=50`
    )
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [username, date]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <AnimatedModalRoot
      onClose={onClose}
      align="bottom"
      ariaLabelledBy="activity-day-title"
      panelClassName="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--background)] border border-[var(--gp-border)] shadow-xl"
    >
      <div className="flex items-center justify-between p-4 border-b border-[var(--gp-border)]">
        <h2 id="activity-day-title" className="text-lg font-semibold">
          {formatModalDate(date)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm gp-text-muted hover:bg-[var(--gp-surface)]"
          aria-label="Close"
        >
          Close
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <p className="gp-text-muted text-sm">Loading check-ins…</p>
        ) : posts.length === 0 ? (
          <p className="gp-text-muted text-sm">No check-ins on this day.</p>
        ) : (
          <PostThumbnailGrid posts={posts} />
        )}
      </div>
    </AnimatedModalRoot>
  );
}
