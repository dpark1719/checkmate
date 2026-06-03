"use client";

import { GOAL_CATEGORIES, type GoalCategory } from "@checkmate/shared";
import {
  countGoalTitles,
  formatDefaultPromiseTime,
  isDuplicateGoalTitle,
} from "@/lib/goal-titles";
import { formatPostDateTime } from "@/lib/format-datetime";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Goal {
  id: string;
  title: string;
  category: string;
  defaultPromiseTime: string;
  isActive: boolean;
}

interface ArchivedGoal extends Goal {
  archivedAt: string;
}

function formatTimeForInput(t: string) {
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return "20:00";
}

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [archivedGoals, setArchivedGoals] = useState<ArchivedGoal[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("fitness");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<GoalCategory>("fitness");
  const [editTime, setEditTime] = useState("20:00");

  function loadGoals() {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => setError("Could not load goals"));
  }

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
  }, []);

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
      body: JSON.stringify({ title, category }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create goal");
      return;
    }
    setTitle("");
    loadGoals();
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setEditTitle(goal.title);
    setEditCategory(goal.category as GoalCategory);
    setEditTime(formatTimeForInput(goal.defaultPromiseTime));
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
            Up to 5 active goals. Tap a goal to see check-ins. Use Edit to change
            details. Removed goals can be restored from Archived goals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="gp-btn-text-neutral shrink-0"
        >
          {showArchived ? "Hide archived" : "Archived goals"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

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
              <div className="flex items-center gap-3 px-4 py-3">
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
            )}
          </li>
        ))}
      </ul>

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
