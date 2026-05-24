"use client";

import { GOAL_CATEGORIES } from "@goalpost/shared";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [timezone, setTimezone] = useState("UTC");
  const [region, setRegion] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setTimezone(d.profile.timezone ?? "UTC");
          setRegion(d.profile.region ?? "");
        }
      });
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, region: region || undefined }),
    });
    setMessage(res.ok ? "Saved." : "Could not save.");
  }

  async function deleteAccount() {
    if (
      !window.confirm(
        "Delete your account permanently? This cannot be undone."
      )
    ) {
      return;
    }
    const res = await fetch("/api/users/me/delete", { method: "POST" });
    if (res.ok) window.location.href = "/";
  }

  return (
    <div className="max-w-md space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={saveProfile} className="space-y-4">
        <div>
          <label className="text-sm text-zinc-400">Timezone</label>
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full mt-1 rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-400">Country (region code)</label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="US"
            className="w-full mt-1 rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 text-zinc-950 font-semibold px-6 py-2"
        >
          Save
        </button>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
      </form>

      <div className="space-y-2 text-sm text-zinc-500">
        <p>Goal categories: {GOAL_CATEGORIES.join(", ")}</p>
        <Link href="/goals" className="text-emerald-400 hover:underline block">
          Manage goals →
        </Link>
      </div>

      <div className="border-t border-zinc-800 pt-6 space-y-3">
        <p className="text-sm text-zinc-400">
          GDPR / CCPA: request account deletion below. Data is removed from our
          systems.
        </p>
        <button
          type="button"
          onClick={deleteAccount}
          className="text-red-400 text-sm hover:underline"
        >
          Delete my account
        </button>
        <a
          href="mailto:support@goalpost.app?subject=Report%20a%20problem"
          className="text-sm text-zinc-500 hover:text-zinc-300 block"
        >
          Report a problem
        </a>
      </div>
    </div>
  );
}
