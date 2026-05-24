"use client";

import { PushRegistration } from "@/components/PushRegistration";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Profile {
  displayName: string;
  username: string;
  timezone: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => setProfile(data.profile ?? null));
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!profile) {
    return <p className="text-zinc-400">Loading profile…</p>;
  }

  return (
    <div className="space-y-6">
      <PushRegistration />
      <h1 className="text-2xl font-bold">{profile.displayName}</h1>
      <p className="text-zinc-400">@{profile.username}</p>
      <p className="text-sm text-zinc-500">Timezone: {profile.timezone}</p>

      <div className="flex flex-col gap-2 text-sm">
        <Link href={`/u/${profile.username}`} className="text-emerald-400 hover:underline">
          View public profile →
        </Link>
        <Link href="/goals" className="text-emerald-400 hover:underline">
          Manage goals →
        </Link>
        <Link href="/settings" className="text-emerald-400 hover:underline">
          Settings & privacy →
        </Link>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="rounded-lg border border-zinc-700 px-6 py-2 text-sm hover:bg-zinc-900"
      >
        Log out
      </button>
    </div>
  );
}
