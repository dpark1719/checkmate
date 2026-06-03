"use client";

import { useMemo } from "react";

export interface HeatmapDay {
  date: string;
  count: number;
  level: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfWeekSunday(date: Date): Date {
  const day = date.getUTCDay();
  return addDays(date, -day);
}

function lastDayOfMonth(from: string): number {
  const [y, m] = from.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function formatDayLabel(date: string, count: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const formatted = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (count === 0) return `${formatted} · No check-ins`;
  const noun = count === 1 ? "check-in" : "check-ins";
  return `${formatted} · ${count} ${noun}`;
}

function buildWeekColumns(from: string, to: string) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const gridStart = startOfWeekSunday(fromDate);
  const gridEnd = addDays(startOfWeekSunday(toDate), 6);

  const weeks: string[][] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(formatDateString(addDays(cursor, i)));
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstInRange = week.find((day) => day >= from && day <= to);
    if (!firstInRange) return;
    const month = parseInt(firstInRange.slice(5, 7), 10) - 1;
    if (month !== lastMonth) {
      monthLabels.push({ weekIndex, label: String(month + 1) });
      lastMonth = month;
    }
  });

  return { weeks, monthLabels };
}

function buildMonthCells(from: string, to: string) {
  const [year, month] = from.split("-").map(Number);
  const firstDate = parseDate(from);
  const leadingEmpty = firstDate.getUTCDay();
  const daysInMonth = lastDayOfMonth(from);

  const cells: { date: string | null; inRange: boolean; dayNum: number | null }[] =
    [];

  for (let i = 0; i < leadingEmpty; i++) {
    cells.push({ date: null, inRange: false, dayNum: null });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      date,
      inRange: date >= from && date <= to,
      dayNum: day,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, inRange: false, dayNum: null });
  }

  return cells;
}

const LEVEL_CLASS = [
  "gp-heat-cell-0",
  "gp-heat-cell-1",
  "gp-heat-cell-2",
  "gp-heat-cell-3",
  "gp-heat-cell-4",
  "gp-heat-cell-5",
] as const;

function HeatLegend() {
  return (
    <div className="flex items-center justify-end gap-1 text-xs gp-text-muted">
      <span>Less</span>
      {LEVEL_CLASS.map((cls) => (
        <span
          key={cls}
          className={`rounded-sm w-[11px] h-[11px] ${cls}`}
          aria-hidden
        />
      ))}
      <span>More</span>
    </div>
  );
}

function MonthCalendar({
  days,
  from,
  to,
  onDayClick,
  compact = false,
}: {
  days: Map<string, HeatmapDay>;
  from: string;
  to: string;
  onDayClick: (date: string, count: number) => void;
  compact?: boolean;
}) {
  const cells = useMemo(() => buildMonthCells(from, to), [from, to]);

  if (compact) {
    return (
      <div className="grid grid-cols-7 gap-[2px] w-full">
        {cells.map((cell, index) => {
          if (!cell.date) {
            return (
              <span
                key={`empty-${index}`}
                className="aspect-square rounded-[2px] opacity-0"
                aria-hidden
              />
            );
          }

          const entry = days.get(cell.date);
          const level = entry?.level ?? 0;
          const levelClass = LEVEL_CLASS[Math.min(level, 5)];
          const inRange = cell.inRange;

          return (
            <span
              key={cell.date}
              className={`aspect-square rounded-[2px] ${levelClass} ${
                inRange ? "" : "opacity-30"
              }`}
              aria-hidden
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] gp-text-muted py-1"
          >
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const entry = days.get(cell.date);
          const count = entry?.count ?? 0;
          const level = entry?.level ?? 0;
          const levelClass = LEVEL_CLASS[Math.min(level, 5)];
          const clickable = cell.inRange && count > 0;

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!clickable}
              title={cell.inRange ? formatDayLabel(cell.date, count) : undefined}
              aria-label={
                cell.inRange
                  ? formatDayLabel(cell.date, count)
                  : `${cell.dayNum} (future)`
              }
              onClick={() => {
                if (clickable) onDayClick(cell.date!, count);
              }}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-opacity ${levelClass} ${
                cell.inRange
                  ? count > 0
                    ? "hover:ring-1 hover:ring-[var(--gp-accent)] cursor-pointer"
                    : "cursor-default text-[var(--gp-muted)]"
                  : "opacity-40 cursor-default text-[var(--gp-subtle)]"
              } focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
            >
              {cell.dayNum}
            </button>
          );
        })}
      </div>
      <HeatLegend />
    </div>
  );
}

function WeekColumns({
  days,
  from,
  to,
  onDayClick,
}: {
  days: Map<string, HeatmapDay>;
  from: string;
  to: string;
  onDayClick: (date: string, count: number) => void;
}) {
  const { weeks, monthLabels } = useMemo(
    () => buildWeekColumns(from, to),
    [from, to]
  );

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          <div
            className="grid gap-[3px] text-[10px] gp-text-muted mb-1 text-center"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, 11px)`,
            }}
          >
            {weeks.map((_, weekIndex) => {
              const label = monthLabels.find((m) => m.weekIndex === weekIndex);
              return (
                <span key={weekIndex} className="truncate leading-none">
                  {label?.label ?? ""}
                </span>
              );
            })}
          </div>

          <div
            className="grid gap-[3px]"
            role="grid"
            aria-label="Check-in activity calendar"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, 11px)`,
              gridTemplateRows: "repeat(7, 11px)",
            }}
          >
            {Array.from({ length: 7 }, (_, dayIndex) =>
              weeks.map((week, weekIndex) => {
                const date = week[dayIndex];
                const inRange = date >= from && date <= to;
                const entry = days.get(date);
                const count = entry?.count ?? 0;
                const level = entry?.level ?? 0;
                const levelClass = LEVEL_CLASS[Math.min(level, 5)];

                if (!inRange) {
                  return (
                    <span
                      key={`${weekIndex}-${dayIndex}`}
                      className="rounded-sm opacity-0 pointer-events-none"
                      aria-hidden
                    />
                  );
                }

                return (
                  <button
                    key={`${weekIndex}-${dayIndex}`}
                    type="button"
                    role="gridcell"
                    title={formatDayLabel(date, count)}
                    aria-label={formatDayLabel(date, count)}
                    disabled={count === 0}
                    onClick={() => onDayClick(date, count)}
                    className={`rounded-sm w-[11px] h-[11px] transition-opacity ${levelClass} ${
                      count > 0
                        ? "hover:ring-1 hover:ring-[var(--gp-accent)] cursor-pointer"
                        : "cursor-default"
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
      <HeatLegend />
    </div>
  );
}

export function ContributionHeatmap({
  days,
  from,
  to,
  layout,
  onDayClick,
}: {
  days: Map<string, HeatmapDay>;
  from: string;
  to: string;
  layout: "month" | "weeks" | "compact";
  onDayClick: (date: string, count: number) => void;
}) {
  if (layout === "compact" || layout === "month") {
    return (
      <MonthCalendar
        days={days}
        from={from}
        to={to}
        onDayClick={onDayClick}
        compact={layout === "compact"}
      />
    );
  }

  return (
    <WeekColumns days={days} from={from} to={to} onDayClick={onDayClick} />
  );
}
