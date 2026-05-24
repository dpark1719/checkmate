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

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("fitness");

  function loadGoals() {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => setGoals(data.goals ?? []));
  }

  useEffect(() => {
    loadGoals();
  }, []);

  async function createGoal(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category }),
    });
    if (res.ok) {
      setTitle("");
      loadGoals();
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Your goals</h1>

      <form onSubmit={createGoal} className="space-y-4 rounded-xl border border-zinc-800 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Goal title"
          required
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-2"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GoalCategory)}
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-2"
        >
          {GOAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 text-zinc-950 font-semibold px-6 py-2"
        >
          Add goal
        </button>
      </form>

      <ul className="space-y-3">
        {goals.map((g) => (
          <li
            key={g.id}
            className="flex justify-between items-center rounded-xl border border-zinc-800 px-4 py-3"
          >
            <div>
              <p className="font-medium">{g.title}</p>
              <p className="text-sm text-zinc-500 capitalize">{g.category}</p>
            </div>
            <span className="text-xs text-zinc-500">{g.defaultPromiseTime}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
