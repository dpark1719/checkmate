"use client";

import { GOAL_CATEGORIES, type GoalCategory } from "@checkmate/shared";
import {
  countGoalTitles,
  formatDefaultPromiseTime,
  isDuplicateGoalTitle,
} from "@/lib/goal-titles";
import {
  daysUntilTarget,
  defaultTargetEndDate,
  formatTargetEndDate,
  isTargetDateReached,
} from "@/lib/goal-dates";
import { formatPostDateTime } from "@/lib/format-datetime";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Goal {
  id: string;
  title: string;
  category: string;
  defaultPromiseTime: string;
  targetEndDate: string | null;
  createdAt: string;
  isActive: boolean;
}

interface ArchivedGoal extends Goal {
  archivedAt: string;
}

interface CompletedGoal extends Goal {
  completedAt: string;
  completionNote: string | null;
}

function formatTimeForInput(t: string) {
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return "20:00";
}

function GoalTimeProgress({
  targetEndDate,
  createdAt,
}: {
  targetEndDate: string | null;
  createdAt: string;
}) {
  if (!targetEndDate) {
    return (
      <p className="text-xs text-amber-500 mt-1">
        Set a target end date to track progress and complete this goal.
      </p>
    );
  }

  const daysLeft = daysUntilTarget(targetEndDate);
  const reached = isTargetDateReached(targetEndDate);
  const start = new Date(createdAt);
  start.setHours(0, 0, 0, 0);
  const end = new Date(`${targetEndDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = today.getTime() - start.getTime();
  const percent =
    totalMs > 0
      ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))
      : reached
        ? 100
        : 0;

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 rounded-full bg-[var(--gp-surface)] overflow-hidden">
        <div
          className={`h-full rounded-full ${reached ? "bg-accent" : "bg-accent/70"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs gp-text-muted">
        {reached
          ? `Target date reached (${formatTargetEndDate(targetEndDate)}) — ready to complete`
          : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left · Target ${formatTargetEndDate(targetEndDate)}`}
      </p>
    </div>
  );
}

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<CompletedGoal[]>([]);
  const [archivedGoals, setArchivedGoals] = useState<ArchivedGoal[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("fitness");
  const [targetEndDate, setTargetEndDate] = useState(defaultTargetEndDate());
  const [error, setError] = useState<string | null>(null);
  const [completedError, setCompletedError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<GoalCategory>("fitness");
  const [editTime, setEditTime] = useState("20:00");
  const [editTargetEndDate, setEditTargetEndDate] = useState(defaultTargetEndDate());

  function loadGoals() {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => setError("Could not load goals"));
  }

  const loadCompletedGoals = useCallback(() => {
    setCompletedLoading(true);
    setCompletedError(null);
    fetch("/api/goals?completed=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setCompletedError(data.error);
          setCompletedGoals([]);
          return;
        }
        setCompletedGoals(data.goals ?? []);
      })
      .catch(() => setCompletedError("Could not load completed goals"))
      .finally(() => setCompletedLoading(false));
  }, []);

  const loadArchivedGoals = useCallback(() => {
    setArchivedLoading(true);
    fetch("/api/goals?archived=true")
      .then((r) => r.json())
      .then((data) => setArchivedGoals(data.goals ?? []))
      .catch(() => setError("Could not load archived goals"))
      .finally(() => setArchivedLoading(false));
  }, []);

  useEffect(() => {
    loadGoals();
    loadCompletedGoals();
  }, [loadCompletedGoals]);

  useEffect(() => {
    if (showArchived) loadArchivedGoals();
  }, [showArchived, loadArchivedGoals]);

  const titleCounts = useMemo(
    () => countGoalTitles(goals.map((g) => g.title)),
    [goals]
  );

  async function createGoal(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, targetEndDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create goal");
      return;
    }
    setTitle("");
    setTargetEndDate(defaultTargetEndDate());
    loadGoals();
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setEditTitle(goal.title);
    setEditCategory(goal.category as GoalCategory);
    setEditTime(formatTimeForInput(goal.defaultPromiseTime));
    setEditTargetEndDate(goal.targetEndDate ?? defaultTargetEndDate());
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setError(null);

    const res = await fetch(`/api/goals/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        category: editCategory,
        targetEndDate: editTargetEndDate,
        defaultPromiseTime: `${editTime}:00`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update goal");
      return;
    }
    setEditingId(null);
    loadGoals();
  }

  async function deleteGoal(id: string, goalTitle: string) {
    if (
      !window.confirm(
        `Remove "${goalTitle}"? It will be archived — you can restore it from Archived goals.`
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not delete goal");
      return;
    }
    if (editingId === id) setEditingId(null);
    loadGoals();
    if (showArchived) loadArchivedGoals();
  }

  async function restoreGoal(id: string) {
    setRestoringId(id);
    setError(null);
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    const data = await res.json();
    setRestoringId(null);
    if (!res.ok) {
      setError(data.error ?? "Could not restore goal");
      return;
    }
    loadGoals();
    loadArchivedGoals();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your goals</h1>
          <p className="text-sm gp-text-muted mt-1">
            Up to 5 active goals. Set a target end date, complete when you&apos;re
            done, and free a slot for your next goal.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="gp-btn-text-neutral"
          >
            {showCompleted ? "Hide completed" : "Completed goals"}
          </button>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="gp-btn-text-neutral"
          >
            {showArchived ? "Hide archived" : "Archived goals"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {completedError && !error ? (
        <p className="text-sm text-amber-500">{completedError}</p>
      ) : null}

      <form onSubmit={createGoal} className="space-y-4 gp-card p-4">
        <h2 className="text-sm font-medium gp-text-muted">Add goal</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Goal title"
          required
          className="gp-input"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GoalCategory)}
          className="gp-input"
        >
          {GOAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="block text-xs gp-text-muted">Target end date</label>
        <input
          type="date"
          value={targetEndDate}
          min={defaultTargetEndDate(0)}
          onChange={(e) => setTargetEndDate(e.target.value)}
          required
          className="gp-input"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent text-accent-foreground font-semibold px-6 py-2"
        >
          Add goal
        </button>
      </form>

      <ul className="space-y-3">
        {goals.length === 0 && (
          <li className="gp-text-muted text-sm py-4">No active goals yet.</li>
        )}
        {goals.map((g) => (
          <li key={g.id} className="rounded-xl border border-[var(--gp-border)] overflow-hidden">
            {editingId === g.id ? (
              <form onSubmit={saveEdit} className="p-4 space-y-3 bg-[var(--gp-card)]/50">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="gp-input"
                />
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as GoalCategory)}
                  className="gp-input"
                >
                  {GOAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <label className="block text-xs gp-text-muted">Target end date</label>
                <input
                  type="date"
                  value={editTargetEndDate}
                  min={defaultTargetEndDate(0)}
                  onChange={(e) => setEditTargetEndDate(e.target.value)}
                  required
                  className="gp-input"
                />
                <label className="block text-xs gp-text-muted">Default promise time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="gp-input"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-accent text-accent-foreground font-semibold py-2 text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-lg border border-[var(--gp-border)] py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/goals/${g.id}`)}
                    className="flex-1 text-left min-w-0 rounded-lg border border-[var(--gp-border)] px-3 py-2 hover:bg-[var(--gp-surface)] hover:border-[var(--gp-muted)] transition-colors"
                  >
                    <p className="font-medium truncate">{g.title}</p>
                    <p className="text-sm gp-text-muted capitalize">
                      {g.category} · Default{" "}
                      {formatDefaultPromiseTime(g.defaultPromiseTime)}
                    </p>
                    {isDuplicateGoalTitle(g.title, titleCounts) && (
                      <p className="text-xs text-amber-500 mt-0.5">
                        Duplicate title — remove or rename this goal
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(g)}
                    className="gp-btn-text gp-btn-text-xs shrink-0"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGoal(g.id, g.title)}
                    className="gp-btn-text-danger gp-btn-text-xs shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <GoalTimeProgress
                  targetEndDate={g.targetEndDate}
                  createdAt={g.createdAt}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {showCompleted && (
        <section className="space-y-3 border-t border-[var(--gp-border)] pt-6">
          <h2 className="text-lg font-semibold">Completed goals</h2>
          {completedLoading ? (
            <p className="gp-text-muted text-sm">Loading completed goals…</p>
          ) : completedGoals.length === 0 ? (
            <p className="gp-text-muted text-sm">No completed goals yet.</p>
          ) : (
            <ul className="space-y-3">
              {completedGoals.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{g.title}</p>
                    <p className="text-sm gp-text-muted capitalize">
                      {g.category}
                      {g.completedAt
                        ? ` · Completed ${formatPostDateTime(g.completedAt)}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/goals/${g.id}`)}
                    className="gp-btn-text gp-btn-text-xs shrink-0"
                  >
                    View progress
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showArchived && (
        <section className="space-y-3 border-t border-[var(--gp-border)] pt-6">
          <h2 className="text-lg font-semibold">Archived goals</h2>
          {archivedLoading ? (
            <p className="gp-text-muted text-sm">Loading archived goals…</p>
          ) : archivedGoals.length === 0 ? (
            <p className="gp-text-muted text-sm">No archived goals.</p>
          ) : (
            <ul className="space-y-3">
              {archivedGoals.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)]/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{g.title}</p>
                    <p className="text-sm gp-text-muted capitalize">
                      {g.category}
                      {g.archivedAt
                        ? ` · Archived ${formatPostDateTime(g.archivedAt)}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/goals/${g.id}`)}
                    className="gp-btn-text-neutral gp-btn-text-xs shrink-0"
                  >
                    View check-ins
                  </button>
                  <button
                    type="button"
                    onClick={() => void restoreGoal(g.id)}
                    disabled={restoringId === g.id}
                    className="gp-btn-text gp-btn-text-xs shrink-0 disabled:opacity-50"
                  >
                    {restoringId === g.id ? "Restoring…" : "Restore"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
