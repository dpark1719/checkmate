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
  const padded = fill ? "p-3 sm:p-4" : compact ? "p-2 sm:p-2.5" : "p-4";
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

      <div className={`flex flex-col flex-1 min-h-0 ${padded}`}>
        <div
          className={`shrink-0 ${fill ? "mb-1.5 sm:mb-2" : compact ? "mb-1" : "mb-2"}`}
        >
          <p
            className={`font-semibold leading-snug truncate ${titleSize}`}
            title={`${post.goalEmoji} ${post.goalTitle}`}
          >
            <span aria-hidden>{post.goalEmoji}</span> {post.goalTitle}
          </p>
        </div>

        <div
          className={`flex items-center gap-1.5 shrink-0 ${
            fill ? "mb-1.5" : compact ? "mb-1" : "mb-2"
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarSize}`}
            style={{ backgroundColor: post.avatarColor }}
            aria-hidden
          >
            {post.avatarInitials}
          </span>
          <p className={`${metaSize} gp-text-muted truncate min-w-0`}>
            <span className="font-medium text-[var(--gp-fg)]">
              {post.username}
            </span>{" "}
            · {post.timeAgo}
          </p>
        </div>

        <p
          className={`gp-text-muted italic leading-snug ${captionSize} ${
            fill
              ? "line-clamp-2 flex-1 min-h-0"
              : compact
                ? "line-clamp-2 mb-1"
                : "line-clamp-3 mb-2"
          }`}
        >
          &ldquo;{post.caption}&rdquo;
        </p>

        <span
          className={`shrink-0 rounded-full bg-[var(--gp-accent-subtle)] font-medium text-accent w-fit ${streakSize} ${
            fill ? "mt-auto" : compact ? "mt-1" : "mt-2"
          }`}
        >
          {post.streakDays}🔥
        </span>

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
