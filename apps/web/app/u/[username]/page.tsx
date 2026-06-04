"use client";

import { ProfilePostsGallery } from "@/components/ProfilePostsGallery";
import { ProfileActivityHeatmap } from "@/components/ProfileActivityHeatmap";
import { SocialLinksDisplay } from "@/components/SocialLinksDisplay";
import { UserAvatar } from "@/components/UserAvatar";
import type { SocialLinks } from "@checkmate/shared";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ActiveGoal {
  id: string;
  title: string;
  category: string;
  currentCount: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [profile, setProfile] = useState<{
    id: string;
    displayName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    timezone: string;
    socialLinks: SocialLinks;
  } | null>(null);
  const [activeGoals, setActiveGoals] = useState<ActiveGoal[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.userId ?? d.profile?.id ?? null))
      .catch(() => {});

    fetch(`/api/users/${username}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.profile) return;

        setProfile({
          id: d.profile.id,
          displayName: d.profile.displayName,
          username: d.profile.username,
          bio: d.profile.bio ?? null,
          avatarUrl: d.profile.avatarUrl ?? null,
          timezone: d.profile.timezone,
          socialLinks: (d.profile.socialLinks ?? {}) as SocialLinks,
        });
        setIsFollowing(Boolean(d.isFollowing));

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
  }, [username]);

  const isOwnProfile = Boolean(
    currentUserId && profile && currentUserId === profile.id
  );

  async function connect() {
    if (!profile) return;
    setConnecting(true);
    setConnectError(null);
    setConnectMessage(null);
    const res = await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: profile.id }),
    });
    setConnecting(false);
    if (!res.ok) {
      const data = await res.json();
      setConnectError(data.error ?? "Could not connect");
      return;
    }
    setIsFollowing(true);
    setConnectMessage("Connected — their posts will appear in your home feed.");
  }

  async function disconnect() {
    if (!profile) return;
    setConnecting(true);
    setConnectError(null);
    setConnectMessage(null);
    const res = await fetch(`/api/follows/${profile.id}`, { method: "DELETE" });
    setConnecting(false);
    if (!res.ok) {
      const data = await res.json();
      setConnectError(data.error ?? "Could not disconnect");
      return;
    }
    setIsFollowing(false);
  }

  async function startMessage() {
    if (!profile) return;
    setMessaging(true);
    setMessageError(null);
    const res = await fetch(`/api/conversations/from-user/${profile.id}`, {
      method: "POST",
    });
    const data = await res.json();
    setMessaging(false);
    if (!res.ok) {
      setMessageError(data.error ?? "Could not start conversation");
      return;
    }
    router.push(`/messages/${data.conversationId}`);
  }

  if (!profile) {
    return <p className="gp-text-muted">Loading profile…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <UserAvatar
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl}
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="text-3xl font-bold">{profile.displayName}</h1>
              <p className="gp-text-muted">@{profile.username}</p>
            </div>
          </div>
          {!isOwnProfile && currentUserId && (
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void startMessage()}
                  disabled={messaging}
                  className="rounded-lg border border-[var(--gp-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--gp-card)] disabled:opacity-50"
                >
                  {messaging ? "…" : "Message"}
                </button>
                {isFollowing ? (
                  <button
                    type="button"
                    onClick={() => void disconnect()}
                    disabled={connecting}
                    className="gp-btn-text-neutral gp-btn-text-xs disabled:opacity-50"
                  >
                    {connecting ? "…" : "Connected"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void connect()}
                    disabled={connecting}
                    className="gp-btn-text gp-btn-text-xs disabled:opacity-50"
                  >
                    {connecting ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {connectMessage && (
          <p className="text-sm text-accent">{connectMessage}</p>
        )}
        {connectError && (
          <p className="text-sm text-red-400">{connectError}</p>
        )}
        {messageError && (
          <p className="text-sm text-red-400">{messageError}</p>
        )}
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0 space-y-3">
            {profile.bio ? (
              <p className="text-[var(--gp-fg)] whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-sm text-[var(--gp-muted)] italic">No bio yet.</p>
            )}
            <SocialLinksDisplay links={profile.socialLinks} />
          </div>
          <ProfileActivityHeatmap username={profile.username} />
        </div>
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
        <ProfilePostsGallery username={profile.username} />
      </section>
    </div>
  );
}
