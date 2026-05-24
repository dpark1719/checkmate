"use client";

import { SocialLinksDisplay } from "@/components/SocialLinksDisplay";
import type { SocialLinks } from "@goalpost/shared";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<{
    displayName: string;
    username: string;
    bio: string | null;
    timezone: string;
    socialLinks: SocialLinks;
  } | null>(null);
  const [streaks, setStreaks] = useState<
    { goalId: string; currentCount: number; goals?: { title: string } }[]
  >([]);
  const [posts, setPosts] = useState<{ id: string; photoUrl: string }[]>([]);

  useEffect(() => {
    fetch(`/api/users/${username}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile({
            displayName: d.profile.displayName,
            username: d.profile.username,
            bio: d.profile.bio ?? null,
            timezone: d.profile.timezone,
            socialLinks: (d.profile.socialLinks ?? {}) as SocialLinks,
          });
          setStreaks(d.streaks ?? []);
        }
      });
    fetch(`/api/users/${username}/posts`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []));
  }, [username]);

  if (!profile) {
    return <p className="text-zinc-400">Loading profile…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{profile.displayName}</h1>
        <p className="text-zinc-400">@{profile.username}</p>
        {profile.bio && (
          <p className="text-zinc-300 whitespace-pre-wrap max-w-lg">{profile.bio}</p>
        )}
        <SocialLinksDisplay links={profile.socialLinks} />
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Active goals</h2>
        <ul className="flex flex-wrap gap-2">
          {streaks.map((s) => (
            <li
              key={s.goalId}
              className="rounded-full border border-zinc-700 px-3 py-1 text-sm"
            >
              {s.goals?.title ?? "Goal"} · {s.currentCount}🔥
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-zinc-500">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {posts.map((p) => (
              <img
                key={p.id}
                src={p.photoUrl}
                alt=""
                className="aspect-square object-cover rounded-lg bg-zinc-900"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
