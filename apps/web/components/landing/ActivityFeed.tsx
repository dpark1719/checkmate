"use client";

import type { MockPost } from "@/lib/landing/mockData";

interface ActivityFeedProps {
  posts: MockPost[];
  visible: boolean;
  compact?: boolean;
}

function ActivityCard({
  post,
  visible,
  delayMs,
  compact,
}: {
  post: MockPost;
  visible: boolean;
  delayMs: number;
  compact?: boolean;
}) {
  return (
    <article
      className={`landing-fade-in rounded-lg border border-[var(--gp-border)] bg-[var(--gp-card)] shadow-sm ${
        compact ? "p-2 sm:p-2.5" : "p-4"
      } ${visible ? "landing-fade-in-visible" : ""}`}
      style={{
        transitionDelay: `${delayMs}ms`,
        borderTopWidth: "2px",
        borderTopColor: post.avatarColor,
      }}
    >
      <div
        className={`flex items-start justify-between gap-1.5 ${compact ? "mb-1.5" : "mb-3"}`}
      >
        <p
          className={`font-semibold leading-snug line-clamp-2 ${
            compact ? "text-[10px] sm:text-[11px]" : "text-sm"
          }`}
        >
          <span aria-hidden>{post.goalEmoji}</span> {post.goalTitle}
        </p>
        <span className="shrink-0 rounded-full bg-[var(--gp-accent-subtle)] px-1.5 py-px text-[9px] font-medium text-accent">
          {post.streakDays}🔥
        </span>
      </div>

      <div
        className={`flex items-center gap-1.5 ${compact ? "mb-1" : "mb-3"}`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${
            compact ? "h-5 w-5 text-[8px]" : "h-8 w-8 text-xs"
          }`}
          style={{ backgroundColor: post.avatarColor }}
          aria-hidden
        >
          {post.avatarInitials}
        </span>
        <p className="text-[9px] sm:text-[10px] gp-text-muted truncate min-w-0">
          <span className="font-medium text-[var(--gp-fg)]">
            {post.username}
          </span>{" "}
          · {post.timeAgo}
        </p>
      </div>

      <p
        className={`gp-text-muted italic leading-snug line-clamp-2 ${
          compact ? "text-[9px] sm:text-[10px] mb-1" : "text-sm mb-3 line-clamp-3"
        }`}
      >
        &ldquo;{post.caption}&rdquo;
      </p>

      {!compact && (
        <p className="text-xs gp-text-subtle">
          🔥{post.reactions.fire}{" "}
          <span className="ml-2">👏{post.reactions.clap}</span>
        </p>
      )}
    </article>
  );
}

export function ActivityFeed({ posts, visible, compact }: ActivityFeedProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 ${compact ? "gap-2 sm:gap-2.5" : "gap-4"}`}
    >
      {posts.map((post, index) => (
        <ActivityCard
          key={post.id}
          post={post}
          visible={visible}
          compact={compact}
          delayMs={(index % 4) * 100 + Math.floor(index / 4) * 50}
        />
      ))}
    </div>
  );
}
