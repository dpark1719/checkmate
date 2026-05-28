"use client";

import { PostDetailModal } from "@/components/PostDetailModal";
import { useEffect, useState } from "react";

export interface DiscoverGridPost {
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
}

export function DiscoverPostGrid({ posts }: { posts: DiscoverGridPost[] }) {
  const [selectedPost, setSelectedPost] = useState<DiscoverGridPost | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.userId) setCurrentUserId(data.userId);
        else if (data.profile?.id) setCurrentUserId(data.profile.id);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {posts.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => setSelectedPost(post)}
            className="relative aspect-square overflow-hidden rounded-md bg-[var(--gp-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
        ))}
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          currentUserId={currentUserId}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}
