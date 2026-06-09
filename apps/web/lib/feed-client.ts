export interface FeedPostLike {
  id: string;
  createdAt: string;
}

export function splitFeedPosts<T extends FeedPostLike>(
  posts: T[],
  feedLastViewedAt: string | null
): { newPosts: T[]; seenPosts: T[] } {
  if (!feedLastViewedAt) {
    return { newPosts: posts, seenPosts: [] };
  }

  const watermark = new Date(feedLastViewedAt).getTime();
  const newPosts: T[] = [];
  const seenPosts: T[] = [];

  for (const post of posts) {
    if (new Date(post.createdAt).getTime() > watermark) {
      newPosts.push(post);
    } else {
      seenPosts.push(post);
    }
  }

  return { newPosts, seenPosts };
}

export async function markFeedViewed(): Promise<void> {
  await fetch("/api/users/me/feed/viewed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}
