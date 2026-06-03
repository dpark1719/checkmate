"use client";

import { ActivityDayModal } from "@/components/ActivityDayModal";
import {
  ContributionHeatmap,
  type HeatmapDay,
} from "@/components/ContributionHeatmap";
import { shiftMonth, shiftYear } from "@checkmate/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

type ActivityRange = "month" | "year" | "all";

interface ActivityResponse {
  timezone: string;
  range: ActivityRange;
  anchor: string;
  accountFrom: string;
  from: string;
  to: string;
  days: HeatmapDay[];
  totals: {
    postDays: number;
    totalPosts: number;
  };
}

function formatMonthTitle(anchor: string): string {
  const [year, month] = anchor.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatRangeLabel(
  range: ActivityRange,
  anchor: string,
  totals: ActivityResponse["totals"]
): string {
  if (totals.totalPosts === 0) {
    return "No check-ins yet — post your first goal today.";
  }

  const dayPart = `${totals.totalPosts} check-in${totals.totalPosts === 1 ? "" : "s"} across ${totals.postDays} day${totals.postDays === 1 ? "" : "s"}`;

  if (range === "month") {
    return `${dayPart} in ${formatMonthTitle(anchor)}`;
  }
  if (range === "year") {
    return `${dayPart} in ${anchor}`;
  }
  return `${dayPart} all time`;
}

function canGoPrev(
  range: ActivityRange,
  anchor: string,
  accountFrom: string
): boolean {
  if (range === "all") return false;
  if (range === "month") {
    return anchor > accountFrom.slice(0, 7);
  }
  return anchor > accountFrom.slice(0, 4);
}

function canGoNext(
  range: ActivityRange,
  anchor: string,
  timezone: string
): boolean {
  if (range === "all") return false;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (range === "month") {
    return anchor < today.slice(0, 7);
  }
  return anchor < today.slice(0, 4);
}

function ActivityHeatmapPanel({
  username,
  onDaySelect,
}: {
  username: string;
  onDaySelect: (date: string) => void;
}) {
  const [range, setRange] = useState<ActivityRange>("month");
  const [navAnchor, setNavAnchor] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActivity = useCallback(() => {
    if (!username) return;
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (range !== "all" && navAnchor) params.set("anchor", navAnchor);
    fetch(
      `/api/users/${encodeURIComponent(username)}/activity?${params.toString()}`
    )
      .then((r) => r.json())
      .then((data: ActivityResponse) => setActivity(data))
      .catch(() => setActivity(null))
      .finally(() => setLoading(false));
  }, [username, range, navAnchor]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const daysMap = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    for (const day of activity?.days ?? []) {
      map.set(day.date, day);
    }
    return map;
  }, [activity?.days]);

  function handleRangeChange(next: ActivityRange) {
    setRange(next);
    setNavAnchor(null);
  }

  function handlePrev() {
    if (!activity || range === "all") return;
    if (range === "month") {
      setNavAnchor(shiftMonth(activity.anchor, -1));
    } else {
      setNavAnchor(shiftYear(activity.anchor, -1));
    }
  }

  function handleNext() {
    if (!activity || range === "all") return;
    if (range === "month") {
      setNavAnchor(shiftMonth(activity.anchor, 1));
    } else {
      setNavAnchor(shiftYear(activity.anchor, 1));
    }
  }

  const title =
    !activity || range === "all"
      ? "All time"
      : range === "month"
        ? formatMonthTitle(activity.anchor)
        : activity.anchor;

  const showNav = range !== "all" && activity;
  const prevDisabled =
    !activity || !canGoPrev(range, activity.anchor, activity.accountFrom);
  const nextDisabled =
    !activity || !canGoNext(range, activity.anchor, activity.timezone);

  if (loading && !activity) {
    return (
      <div className="space-y-3">
        <div className="h-8 rounded bg-[var(--gp-surface)] animate-pulse" />
        <div className="h-4 w-48 rounded bg-[var(--gp-surface)] animate-pulse" />
        <div className="h-[180px] rounded bg-[var(--gp-surface)] animate-pulse" />
      </div>
    );
  }

  if (!activity) {
    return (
      <p className="gp-text-muted text-sm">Could not load activity calendar.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["month", "year", "all"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleRangeChange(mode)}
            className={
              range === mode ? "gp-btn-text" : "gp-btn-text-neutral gp-btn-text-xs"
            }
          >
            {mode === "month" ? "Month" : mode === "year" ? "Year" : "All"}
          </button>
        ))}
      </div>

      {showNav && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={prevDisabled}
            className="gp-btn-text-neutral gp-btn-text-xs px-2"
            aria-label="Previous period"
          >
            ‹
          </button>
          <span className="text-sm font-medium">{title}</span>
          <button
            type="button"
            onClick={handleNext}
            disabled={nextDisabled}
            className="gp-btn-text-neutral gp-btn-text-xs px-2"
            aria-label="Next period"
          >
            ›
          </button>
        </div>
      )}

      {range === "all" && (
        <p className="text-sm font-medium text-center">{title}</p>
      )}

      <p className="text-sm gp-text-muted">
        {formatRangeLabel(range, activity.anchor, activity.totals)}
      </p>

      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        <ContributionHeatmap
          days={daysMap}
          from={activity.from}
          to={activity.to}
          layout={range === "month" ? "month" : "weeks"}
          onDayClick={(date, count) => {
            if (count > 0) onDaySelect(date);
          }}
        />
      </div>
    </div>
  );
}

export function ProfileActivityHeatmap({ username }: { username: string }) {
  const [expanded, setExpanded] = useState(false);
  const [compactActivity, setCompactActivity] = useState<ActivityResponse | null>(
    null
  );
  const [compactLoading, setCompactLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setCompactLoading(true);
    fetch(
      `/api/users/${encodeURIComponent(username)}/activity?range=month`
    )
      .then((r) => r.json())
      .then((data: ActivityResponse) => setCompactActivity(data))
      .catch(() => setCompactActivity(null))
      .finally(() => setCompactLoading(false));
  }, [username]);

  useEffect(() => {
    if (!expanded) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !selectedDate) setExpanded(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, selectedDate]);

  const compactDaysMap = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    for (const day of compactActivity?.days ?? []) {
      map.set(day.date, day);
    }
    return map;
  }, [compactActivity?.days]);

  if (compactLoading) {
    return (
      <div className="w-full max-w-[160px] ml-auto space-y-2">
        <div className="h-4 w-36 ml-auto rounded bg-[var(--gp-surface)] animate-pulse" />
        <div className="aspect-[7/6] rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface)] animate-pulse" />
      </div>
    );
  }

  if (!compactActivity) {
    return null;
  }

  const monthLabel = formatMonthTitle(compactActivity.anchor);

  return (
    <>
      <div className="w-full max-w-[160px] ml-auto space-y-2">
        <p className="text-sm font-semibold text-[var(--gp-fg)] text-right">
          Consistency Tracker:
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-lg border border-[var(--gp-border)] p-2 transition-colors hover:border-[var(--gp-accent)] hover:bg-[var(--gp-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`View Consistency Tracker for ${monthLabel}`}
        >
          <div className="relative">
            <ContributionHeatmap
              days={compactDaysMap}
              from={compactActivity.from}
              to={compactActivity.to}
              layout="compact"
              onDayClick={() => {}}
            />
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-medium text-[var(--gp-fg)] px-1 py-0.5 rounded bg-[var(--background)]/85">
                {monthLabel}
              </span>
            </span>
          </div>
        </button>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-heatmap-title"
        >
          <div
            className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--background)] border border-[var(--gp-border)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--gp-border)]">
              <h2 id="activity-heatmap-title" className="text-lg font-semibold">
                Consistency Tracker
              </h2>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-lg px-2 py-1 text-sm gp-text-muted hover:bg-[var(--gp-surface)]"
                aria-label="Close"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <ActivityHeatmapPanel
                username={username}
                onDaySelect={setSelectedDate}
              />
            </div>
          </div>
        </div>
      )}

      {selectedDate && (
        <ActivityDayModal
          username={username}
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}
