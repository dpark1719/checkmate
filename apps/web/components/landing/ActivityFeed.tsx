"use client";

import type { MockPost } from "@/lib/landing/mockData";

interface ActivityFeedProps {
  posts: MockPost[];
  visible: boolean;
  compact?: boolean;
  fill?: boolean;
}

function ActivityCard({
  post,
  visible,
  delayMs,
  compact,
  fill,
}: {
  post: MockPost;
  visible: boolean;
  delayMs: number;
  compact?: boolean;
  fill?: boolean;
}) {
  const titleSize = fill
    ? "text-xs sm:text-sm"
    : compact
      ? "text-[10px] sm:text-[11px]"
      : "text-sm";
  const metaSize = fill
    ? "text-[10px] sm:text-xs"
    : compact
      ? "text-[9px] sm:text-[10px]"
      : "text-xs";
  const captionSize = fill
    ? "text-[11px] sm:text-sm flex-1"
    : compact
      ? "text-[9px] sm:text-[10px]"
      : "text-sm";
  const avatarSize = fill
    ? "h-7 w-7 sm:h-8 sm:w-8 text-[10px] sm:text-xs"
    : compact
      ? "h-5 w-5 text-[8px]"
      : "h-8 w-8 text-xs";
  const streakSize = fill
    ? "text-[10px] sm:text-xs px-2 py-0.5"
    : "text-[9px] px-1.5 py-px";

  const goalPadding = fill
    ? "px-3 pt-3 sm:px-4 sm:pt-4 pb-2"
    : compact
      ? "px-2 pt-2 sm:px-2.5 sm:pt-2.5 pb-1.5"
      : "px-4 pt-4 pb-3";
  const footerPadding = fill
    ? "px-3 pt-1.5 pb-3 sm:px-4 sm:pt-2 sm:pb-4"
    : compact
      ? "px-2 pt-1 pb-2 sm:px-2.5 sm:pt-1.5 sm:pb-2.5"
      : "px-4 pt-2 pb-4";

  return (
    <article
      className={`landing-fade-in rounded-lg border border-[var(--gp-border)] bg-[var(--gp-card)] shadow-sm min-h-0 overflow-hidden ${
        fill ? "h-full flex flex-col" : ""
      } ${visible ? "landing-fade-in-visible" : ""}`}
      style={{
        transitionDelay: `${delayMs}ms`,
        borderTopWidth: fill ? "3px" : "2px",
        borderTopColor: post.avatarColor,
      }}
    >
      <div className={`shrink-0 ${goalPadding}`}>
        <p
          className={`font-semibold leading-snug truncate ${titleSize}`}
          title={post.goalTitle}
        >
          {post.goalTitle}
        </p>
      </div>

      {post.imageUrl && (
        <div
          className={`relative w-full shrink-0 bg-[var(--gp-surface)] ${
            fill ? "aspect-[4/3]" : compact ? "aspect-square" : "aspect-[4/3]"
          }`}
        >
          <img
            src={post.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      )}

      <div className={`flex flex-col flex-1 min-h-0 ${footerPadding}`}>
        <div
          className={`flex items-center justify-between gap-2 shrink-0 ${
            fill ? "mb-1.5" : compact ? "mb-1" : "mb-2"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-[var(--gp-card)] ${avatarSize}`}
              style={{ backgroundColor: post.avatarColor }}
              aria-hidden
            >
              {post.avatarInitials}
            </span>
            <p
              className={`${metaSize} font-medium text-[var(--gp-fg)] truncate min-w-0`}
            >
              {post.username}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full bg-[var(--gp-accent-subtle)] font-medium text-accent ${streakSize}`}
          >
            {post.streakDays}🔥
          </span>
        </div>

        <p
          className={`gp-text-muted italic leading-snug ${captionSize} ${
            fill
              ? "line-clamp-2 flex-1 min-h-0"
              : compact
                ? "line-clamp-2"
                : "line-clamp-3"
          }`}
        >
          &ldquo;{post.caption}&rdquo;
        </p>

        {!compact && !fill && (
          <p className="text-xs gp-text-subtle mt-2">
            🔥{post.reactions.fire}{" "}
            <span className="ml-2">👏{post.reactions.clap}</span>
          </p>
        )}
      </div>
    </article>
  );
}

export function ActivityFeed({ posts, visible, compact, fill }: ActivityFeedProps) {
  const gap = fill ? "gap-2 sm:gap-3" : compact ? "gap-2 sm:gap-2.5" : "gap-4";

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 grid-rows-4 sm:grid-rows-2 ${gap} ${
        fill ? "flex-1 min-h-0 h-full" : ""
      }`}
    >
      {posts.map((post, index) => (
        <ActivityCard
          key={post.id}
          post={post}
          visible={visible}
          compact={compact}
          fill={fill}
          delayMs={(index % 4) * 100 + Math.floor(index / 4) * 50}
        />
      ))}
    </div>
  );
}
