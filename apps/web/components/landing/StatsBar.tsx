"use client";

import { useEffect, useState } from "react";

export function useCountUp(
  target: number,
  active: boolean,
  durationMs = 1500
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, target, durationMs]);

  return value;
}

function formatStat(n: number): string {
  return n.toLocaleString();
}

interface StatsBarProps {
  lockedInToday: number;
  activeStreaks: number;
  goalCategoriesActive: number;
  categories: { label: string }[];
  animate: boolean;
}

export function StatsBar({
  lockedInToday,
  activeStreaks,
  goalCategoriesActive,
  categories,
  animate,
}: StatsBarProps) {
  const lockedIn = useCountUp(lockedInToday, animate);
  const streaks = useCountUp(activeStreaks, animate);
  const categoriesCount = useCountUp(goalCategoriesActive, animate);

  const [categoryIndex, setCategoryIndex] = useState(0);
  const [categoryVisible, setCategoryVisible] = useState(true);

  useEffect(() => {
    if (categories.length <= 1) return;

    const interval = setInterval(() => {
      setCategoryVisible(false);
      setTimeout(() => {
        setCategoryIndex((i) => (i + 1) % categories.length);
        setCategoryVisible(true);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, [categories.length]);

  return (
    <div className="rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] px-4 py-6 sm:px-8 sm:py-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 text-center">
        <div>
          <div className="flex items-center justify-center gap-2">
            <span
              className="h-2 w-2 rounded-full bg-green-500 landing-live-pulse"
              aria-hidden
            />
            <p className="text-3xl sm:text-4xl font-bold tabular-nums">
              {formatStat(lockedIn)}
            </p>
          </div>
          <p className="text-xs sm:text-sm gp-text-muted mt-1">
            locked in today
          </p>
        </div>

        <div>
          <p className="text-3xl sm:text-4xl font-bold tabular-nums">
            {formatStat(streaks)}
          </p>
          <p className="text-xs sm:text-sm gp-text-muted mt-1">
            active streaks
          </p>
        </div>

        <div>
          <p className="text-3xl sm:text-4xl font-bold tabular-nums">
            {formatStat(categoriesCount)}
          </p>
          <p className="text-xs sm:text-sm gp-text-muted mt-1">
            goal categories active now
          </p>
          <p
            className={`text-xs sm:text-sm text-[var(--gp-fg)] mt-1 min-h-[1.25rem] transition-opacity duration-300 ${
              categoryVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {categories[categoryIndex]?.label}
          </p>
        </div>
      </div>
    </div>
  );
}
