"use client";

import { goalCategoryEmoji } from "@/lib/goal-categories";

export interface PostGoalGridChallenge {
  id: string;
  postedAt: string | null;
  goals?: { title: string; category: string };
}

interface PostGoalGridProps {
  challenges: PostGoalGridChallenge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PostGoalGrid({
  challenges,
  selectedId,
  onSelect,
}: PostGoalGridProps) {
  const cols =
    challenges.length <= 2
      ? "grid-cols-2"
      : challenges.length <= 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={`grid ${cols} gap-2 sm:gap-3`}>
      {challenges.map((challenge) => {
        const done = Boolean(challenge.postedAt);
        const selected = challenge.id === selectedId;
        const title = challenge.goals?.title ?? "Goal";
        const category = challenge.goals?.category ?? "other";
        const emoji = goalCategoryEmoji(category);

        return (
          <button
            key={challenge.id}
            type="button"
            onClick={() => onSelect(challenge.id)}
            className={`relative aspect-square rounded-xl border p-3 flex flex-col items-center justify-between text-center transition-all ${
              selected
                ? "border-accent bg-[var(--gp-accent-subtle)] ring-2 ring-accent/40 shadow-md scale-[1.02]"
                : done
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                  : "border-[var(--gp-border)] bg-[var(--gp-card)] hover:border-[var(--gp-muted)] hover:bg-[var(--gp-surface)]"
            }`}
            aria-pressed={selected}
            aria-label={`${title}${done ? ", posted" : ", not posted yet"}`}
          >
            <span className="text-2xl sm:text-3xl leading-none" aria-hidden>
              {emoji}
            </span>
            <p className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 w-full text-[var(--gp-fg)]">
              {title}
            </p>
            <span
              className={`text-[10px] font-medium uppercase tracking-wide ${
                done ? "text-emerald-500" : "gp-text-muted"
              }`}
            >
              {done ? "Posted ✓" : "Post"}
            </span>
            {selected && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
