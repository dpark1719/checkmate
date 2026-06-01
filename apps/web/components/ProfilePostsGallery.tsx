"use client";

import { useEffect, useState } from "react";

interface GalleryPost {
  id: string;
  photoUrl: string;
}

export function ProfilePostsGallery({ username }: { username: string }) {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}/posts`)
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return <p className="gp-text-muted text-sm">Loading posts…</p>;
  }

  if (posts.length === 0) {
    return (
      <p className="gp-text-muted text-sm">
        No posts yet. Share your first check-in from the Post tab.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative aspect-square overflow-hidden rounded-md bg-[var(--gp-card)]"
        >
          <img
            src={post.photoUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
