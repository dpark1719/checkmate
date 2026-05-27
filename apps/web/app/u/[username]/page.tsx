"use client";

import { SocialLinksDisplay } from "@/components/SocialLinksDisplay";
import { UserAvatar } from "@/components/UserAvatar";
import type { SocialLinks } from "@goalpost/shared";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ActiveGoal {
  id: string;
  title: string;
  category: string;
  currentCount: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<{
    displayName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    timezone: string;
    socialLinks: SocialLinks;
  } | null>(null);
  const [activeGoals, setActiveGoals] = useState<ActiveGoal[]>([]);
  const [posts, setPosts] = useState<{ id: string; photoUrl: string }[]>([]);

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.profile) return;

        setProfile({
          displayName: d.profile.displayName,
          username: d.profile.username,
          bio: d.profile.bio ?? null,
          avatarUrl: d.profile.avatarUrl ?? null,
          timezone: d.profile.timezone,
          socialLinks: (d.profile.socialLinks ?? {}) as SocialLinks,
        });

        const streakByGoal = new Map<string, number>();
        for (const s of d.streaks ?? []) {
          const goalId = (s.goalId ?? s.goal_id) as string;
          const count = (s.currentCount ?? s.current_count ?? 0) as number;
          if (goalId) streakByGoal.set(goalId, count);
        }

        const goals: ActiveGoal[] = (d.goals ?? []).map(
          (g: {
            id: string;
            title: string;
            category: string;
          }) => ({
            id: g.id,
            title: g.title,
            category: g.category,
            currentCount: streakByGoal.get(g.id) ?? 0,
          })
        );
        setActiveGoals(goals);
      });
    fetch(`/api/users/${username}/posts`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []));
  }, [username]);

  if (!profile) {
    return <p className="gp-text-muted">Loading profile…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-4">
          <UserAvatar
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl}
            size="lg"
          />
          <div>
            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
            <p className="gp-text-muted">@{profile.username}</p>
          </div>
        </div>
        {profile.bio ? (
          <p className="text-[var(--gp-fg)] whitespace-pre-wrap max-w-lg">{profile.bio}</p>
        ) : (
          <p className="text-sm text-[var(--gp-muted)] italic">No bio yet.</p>
        )}
        <SocialLinksDisplay links={profile.socialLinks} />
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Active goals</h2>
        {activeGoals.length === 0 ? (
          <p className="text-sm text-[var(--gp-muted)]">No active goals right now.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {activeGoals.map((g) => (
              <li
                key={g.id}
                className="rounded-full border border-[var(--gp-border)] px-3 py-1 text-sm capitalize"
              >
                {g.title} · {g.category}
                {g.currentCount > 0 ? ` · ${g.currentCount}🔥` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Posts</h2>
        {posts.length === 0 ? (
          <p className="gp-text-muted">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {posts.map((p) => (
              <img
                key={p.id}
                src={p.photoUrl}
                alt=""
                className="aspect-square object-cover rounded-lg bg-[var(--gp-card)]"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
