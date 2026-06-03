"use client";

import { GOAL_CATEGORIES, type GoalCategory } from "@checkmate/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("fitness");
  const [promiseTime, setPromiseTime] = useState("20:00");
  const [birthYear, setBirthYear] = useState(
    String(new Date().getFullYear() - 18)
  );
  const [region, setRegion] = useState<"us" | "eu" | "other">("us");
  const [error, setError] = useState<string | null>(null);

  async function complete(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const year = parseInt(birthYear, 10);
    const minAge = region === "eu" ? 16 : 13;
    const age = new Date().getFullYear() - year;
    if (age < minAge) {
      setError(`You must be at least ${minAge} years old to use CheckMate.`);
      return;
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timezone: tz,
        region: region === "us" ? "US" : region === "eu" ? "EU" : null,
        notificationPreferences: { ageVerified: true, birthYear: year },
      }),
    });

    const goalRes = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        defaultPromiseTime: `${promiseTime}:00`,
      }),
    });

    if (!goalRes.ok) {
      const data = await goalRes.json();
      setError(data.error ?? "Could not create goal");
      return;
    }

    router.push("/feed");
  }

  async function skip() {
    router.push("/feed");
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Set your first goal</h1>
      <p className="gp-text-muted">
        You&apos;ll get a daily trigger between 5am and 10pm. After that, you
        confirm when you&apos;ll post today.
      </p>

      <form onSubmit={complete} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you working toward?"
          required
          className="w-full rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-4 py-3"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GoalCategory)}
          className="w-full rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-4 py-3"
        >
          {GOAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="block text-sm gp-text-muted">Birth year</label>
        <input
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          required
          className="w-full rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-4 py-3"
        />
        <label className="block text-sm gp-text-muted">Region (for age rules)</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as "us" | "eu" | "other")}
          className="w-full rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-4 py-3"
        >
          <option value="us">United States (13+)</option>
          <option value="eu">EU / UK (16+)</option>
          <option value="other">Other (13+)</option>
        </select>
        <label className="block text-sm gp-text-muted">
          Default promise time (if you skip after trigger, 8pm is used)
        </label>
        <input
          type="time"
          value={promiseTime}
          onChange={(e) => setPromiseTime(e.target.value)}
          className="w-full rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-4 py-3"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3"
        >
          Continue
        </button>
      </form>
      <button
        type="button"
        onClick={skip}
        className="w-full gp-btn-text-neutral"
      >
        Skip for now
      </button>
    </div>
  );
}
