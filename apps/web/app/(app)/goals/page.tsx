"use client";

import { GOAL_CATEGORIES, type GoalCategory } from "@goalpost/shared";
import { useEffect, useState } from "react";

interface Goal {
  id: string;
  title: string;
  category: string;
  defaultPromiseTime: string;
  isActive: boolean;
}

function formatTimeForInput(t: string) {
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return "20:00";
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
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

  useEffect(() => {
    loadGoals();
  }, []);

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
        `Remove "${goalTitle}"? It will be archived and hidden from your active goals.`
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
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Your goals</h1>
      <p className="text-sm gp-text-muted">Up to 5 active goals. Tap a goal to edit or remove.</p>

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
                  onClick={() => startEdit(g)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="font-medium truncate">{g.title}</p>
                  <p className="text-sm gp-text-muted capitalize">
                    {g.category} · {formatTimeForInput(g.defaultPromiseTime)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(g)}
                  className="text-sm text-accent hover:underline shrink-0"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteGoal(g.id, g.title)}
                  className="text-sm text-red-400 hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
