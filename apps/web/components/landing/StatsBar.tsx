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
  animate: boolean;
}

export function StatsBar({
  lockedInToday,
  activeStreaks,
  animate,
}: StatsBarProps) {
  const lockedIn = useCountUp(lockedInToday, animate);
  const streaks = useCountUp(activeStreaks, animate);

  return (
    <div className="rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="text-center min-w-0">
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-green-500 landing-live-pulse shrink-0"
              aria-hidden
            />
            <p className="text-lg sm:text-xl font-bold tabular-nums leading-none">
              {formatStat(lockedIn)}
            </p>
          </div>
          <p className="text-xs gp-text-muted mt-0.5 leading-tight">
            locked in today
          </p>
        </div>

        <div className="text-center min-w-0 border-l border-[var(--gp-border)] pl-2 sm:pl-3">
          <p className="text-lg sm:text-xl font-bold tabular-nums leading-none">
            {formatStat(streaks)}
          </p>
          <p className="text-xs gp-text-muted mt-0.5 leading-tight">
            active streaks
          </p>
        </div>
      </div>
    </div>
  );
}
