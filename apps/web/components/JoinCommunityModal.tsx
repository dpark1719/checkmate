"use client";

import type { GoalCategory } from "@checkmate/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

interface GoalOption {
  id: string;
  title: string;
  category: string;
}

interface JoinCommunityModalProps {
  category: GoalCategory;
  open: boolean;
  onClose: () => void;
  onJoined: (goalTitle: string) => void;
  existingGoalId?: string | null;
}

export function JoinCommunityModal({
  category,
  open,
  onClose,
  onJoined,
  existingGoalId,
}: JoinCommunityModalProps) {
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(existingGoalId ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSelectedId(existingGoalId ?? null);
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.goals ?? []) as GoalOption[];
        setGoals(list.filter((g) => g.category === category));
      });
  }, [open, category, existingGoalId]);

  if (!open) return null;

  async function confirm() {
    if (!selectedId) {
      setError("Pick a goal to share in this community.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/communities/${category}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: selectedId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not join community");
      return;
    }
    onJoined(data.sharedGoalTitle ?? goals.find((g) => g.id === selectedId)?.title ?? "");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal
      aria-labelledby="join-community-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--gp-border)] bg-[var(--background)] p-5 space-y-4 shadow-xl">
        <h2 id="join-community-title" className="text-lg font-semibold capitalize">
          {existingGoalId ? "Change" : "Share a"} {category} goal
        </h2>
        <p className="text-sm gp-text-muted">
          Pick the goal you want to highlight in this community. Your posts for any{" "}
          <span className="capitalize">{category}</span> goal appear in the feed;
          this choice is shown on your profile in Discover.
        </p>

        {goals.length === 0 ? (
          <div className="space-y-3 text-sm">
            <p className="gp-text-muted">
              You need an active <span className="capitalize">{category}</span> goal
              first.
            </p>
            <Link
              href="/goals"
              className="inline-block text-accent hover:underline"
              onClick={onClose}
            >
              Create a goal →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {goals.map((g) => (
              <li key={g.id}>
                <label className="flex items-center gap-3 rounded-lg border border-[var(--gp-border)] px-3 py-2 cursor-pointer hover:border-[var(--gp-border)] has-[:checked]:border-accent has-[:checked]:bg-[var(--gp-accent-subtle)]">
                  <input
                    type="radio"
                    name="sharedGoal"
                    value={g.id}
                    checked={selectedId === g.id}
                    onChange={() => setSelectedId(g.id)}
                    className="accent-accent"
                  />
                  <span className="font-medium">{g.title}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--gp-border)] py-2.5 text-sm"
          >
            Cancel
          </button>
          {goals.length > 0 && (
            <button
              type="button"
              disabled={loading || !selectedId}
              onClick={confirm}
              className="flex-1 rounded-lg bg-accent text-accent-foreground font-semibold py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? "Saving…" : existingGoalId ? "Update goal" : "Join community"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
