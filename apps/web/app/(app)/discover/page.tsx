"use client";

import { JoinCommunityModal } from "@/components/JoinCommunityModal";
import { GOAL_CATEGORIES, type GoalCategory } from "@checkmate/shared";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Community {
  id: string;
  category: string;
  memberCount: number;
}

interface Membership {
  category: string;
  sharedGoalId: string | null;
  sharedGoalTitle: string | null;
}

export default function DiscoverPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<GoalCategory | null>(null);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);

  const load = useCallback(() => {
    fetch("/api/communities")
      .then((r) => r.json())
      .then((data) => {
        setCommunities(data.communities ?? []);
        setMemberships(data.myMemberships ?? []);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function membershipFor(category: string) {
    return memberships.find((m) => m.category === category);
  }

  function openJoin(category: GoalCategory) {
    const existing = membershipFor(category);
    setEditingMembership(existing ?? null);
    setModalCategory(category);
  }

  async function leave(category: GoalCategory) {
    setLoading(category);
    const res = await fetch(`/api/communities/${category}/join`, {
      method: "DELETE",
    });
    setLoading(null);
    if (res.ok) load();
  }

  function onJoined() {
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Discover</h1>
      <p className="gp-text-muted">
        Join a community and choose which goal to share. Only posts for that goal
        show in the community feed.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {communities.map((c) => {
          const membership = membershipFor(c.category);
          const isJoined = Boolean(membership);

          return (
            <div
              key={c.id}
              className="rounded-xl border border-[var(--gp-border)] p-4 flex flex-col gap-3"
            >
              <div className="capitalize">
                <p className="font-semibold text-lg">{c.category}</p>
                <p className="text-sm gp-text-muted">{c.memberCount} members</p>
                {isJoined && membership?.sharedGoalTitle && (
                  <p className="text-sm text-accent/90 mt-1">
                    Sharing: {membership.sharedGoalTitle}
                  </p>
                )}
                {isJoined && !membership?.sharedGoalId && (
                  <p className="text-sm text-amber-400 mt-1">
                    Pick a goal to share — posts won&apos;t show until you do.
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {isJoined ? (
                  <>
                    <button
                      type="button"
                      disabled={loading === c.category}
                      onClick={() => openJoin(c.category as GoalCategory)}
                      className="flex-1 min-w-[7rem] rounded-lg bg-[var(--gp-accent-subtle)] text-accent border border-accent/40 py-2 text-sm font-medium hover:bg-accent/20 disabled:opacity-50"
                    >
                      Change goal
                    </button>
                    <button
                      type="button"
                      disabled={loading === c.category}
                      onClick={() => leave(c.category as GoalCategory)}
                      className="rounded-lg border border-[var(--gp-border)] px-3 py-2 text-sm gp-text-muted hover:bg-[var(--gp-card)] disabled:opacity-50"
                    >
                      Leave
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={loading === c.category}
                    onClick={() => openJoin(c.category as GoalCategory)}
                    className="flex-1 rounded-lg bg-accent text-accent-foreground py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    Join
                  </button>
                )}
                <Link
                  href={`/discover/${c.category}`}
                  className="rounded-lg border border-[var(--gp-border)] px-3 py-2 text-sm hover:bg-[var(--gp-card)]"
                >
                  Feed
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {communities.length === 0 &&
        GOAL_CATEGORIES.map((cat) => (
          <p key={cat} className="gp-text-subtle text-sm capitalize">
            {cat}
          </p>
        ))}

      {modalCategory && (
        <JoinCommunityModal
          category={modalCategory}
          open
          existingGoalId={editingMembership?.sharedGoalId}
          onClose={() => {
            setModalCategory(null);
            setEditingMembership(null);
          }}
          onJoined={onJoined}
        />
      )}
    </div>
  );
}
