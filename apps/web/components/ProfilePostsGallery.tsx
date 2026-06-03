"use client";

import {
  PostThumbnailGrid,
  type ThumbnailPost,
} from "@/components/PostThumbnailGrid";
import { useCallback, useEffect, useState } from "react";

export function ProfilePostsGallery({ username }: { username: string }) {
  const [posts, setPosts] = useState<ThumbnailPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}/posts`)
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

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
    <PostThumbnailGrid posts={posts} onPostUpdated={() => loadPosts()} />
  );
}
