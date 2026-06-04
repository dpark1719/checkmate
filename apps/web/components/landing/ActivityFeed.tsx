"use client";

import type { MockPost } from "@/lib/landing/mockData";

interface ActivityFeedProps {
  posts: MockPost[];
  visible: boolean;
}

function ActivityCard({
  post,
  visible,
  delayMs,
}: {
  post: MockPost;
  visible: boolean;
  delayMs: number;
}) {
  return (
    <article
      className={`landing-fade-in rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-card)] p-4 shadow-sm ${
        visible ? "landing-fade-in-visible" : ""
      }`}
      style={{
        transitionDelay: `${delayMs}ms`,
        borderTopWidth: "3px",
        borderTopColor: post.avatarColor,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold leading-snug">
          <span aria-hidden>{post.goalEmoji}</span> {post.goalTitle}
        </p>
        <span className="shrink-0 rounded-full bg-[var(--gp-accent-subtle)] px-2 py-0.5 text-[10px] font-medium text-accent">
          {post.streakDays}🔥
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: post.avatarColor }}
          aria-hidden
        >
          {post.avatarInitials}
        </span>
        <p className="text-xs gp-text-muted truncate">
          <span className="font-medium text-[var(--gp-fg)]">
            {post.username}
          </span>{" "}
          · {post.timeAgo}
        </p>
      </div>

      <p className="text-sm gp-text-muted italic leading-relaxed mb-3 line-clamp-3">
        &ldquo;{post.caption}&rdquo;
      </p>

      <p className="text-xs gp-text-subtle">
        🔥{post.reactions.fire}{" "}
        <span className="ml-2">👏{post.reactions.clap}</span>
      </p>
    </article>
  );
}

export function ActivityFeed({ posts, visible }: ActivityFeedProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {posts.map((post, index) => (
        <ActivityCard
          key={post.id}
          post={post}
          visible={visible}
          delayMs={(index % 4) * 100 + Math.floor(index / 4) * 50}
        />
      ))}
    </div>
  );
}
