"use client";

import { PostDetailModal, type ThumbnailPost } from "@/components/PostDetailModal";
import { StaggerItem, StaggerList } from "@/components/motion/StaggerList";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export type { ThumbnailPost };

export function PostThumbnailGrid({
  posts,
  onPostUpdated,
}: {
  posts: ThumbnailPost[];
  onPostUpdated?: (post: ThumbnailPost) => void;
}) {
  const [gridPosts, setGridPosts] = useState(posts);
  const [selectedPost, setSelectedPost] = useState<ThumbnailPost | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [canModeratePosts, setCanModeratePosts] = useState(false);

  useEffect(() => {
    setGridPosts(posts);
  }, [posts]);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.userId) setCurrentUserId(data.userId);
        else if (data.profile?.id) setCurrentUserId(data.profile.id);
        if (data.canModeratePosts) setCanModeratePosts(true);
      })
      .catch(() => {});
  }, []);

  function handleUpdated(updated: ThumbnailPost) {
    setGridPosts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setSelectedPost(updated);
    onPostUpdated?.(updated);
  }

  function handleRemoved(postId: string) {
    setGridPosts((prev) => prev.filter((p) => p.id !== postId));
    setSelectedPost(null);
  }

  if (gridPosts.length === 0) {
    return null;
  }

  return (
    <>
      <StaggerList className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {gridPosts.map((post) => (
          <StaggerItem key={post.id}>
            <button
              type="button"
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square w-full overflow-hidden rounded-md bg-[var(--gp-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={
                post.author
                  ? `View post by ${post.author.displayName}`
                  : "View post"
              }
            >
              <img
                src={post.photoUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              {post.isLate && (
                <span className="absolute top-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-medium text-amber-300">
                  Late
                </span>
              )}
            </button>
          </StaggerItem>
        ))}
      </StaggerList>

      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            key={selectedPost.id}
            post={selectedPost}
            currentUserId={currentUserId}
            canModeratePosts={canModeratePosts}
            onClose={() => setSelectedPost(null)}
            onUpdated={handleUpdated}
            onRemoved={() => handleRemoved(selectedPost.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
