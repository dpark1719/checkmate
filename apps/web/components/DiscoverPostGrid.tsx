"use client";

import {
  PostThumbnailGrid,
  type ThumbnailPost,
} from "@/components/PostThumbnailGrid";

export type DiscoverGridPost = ThumbnailPost;

export function DiscoverPostGrid({ posts }: { posts: DiscoverGridPost[] }) {
  return <PostThumbnailGrid posts={posts} />;
}
