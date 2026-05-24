"use client";

import { ProfileTabs, type ProfileTabId } from "@/components/ProfileTabs";
import { PushRegistration } from "@/components/PushRegistration";
import {
  SocialLinksEditor,
  socialLinksToFormState,
} from "@/components/SocialLinksEditor";
import { SocialLinksDisplay } from "@/components/SocialLinksDisplay";
import {
  GOAL_CATEGORIES,
  type SocialLinkPlatformId,
  type SocialLinks,
} from "@goalpost/shared";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface Profile {
  displayName: string;
  username: string;
  bio: string | null;
  timezone: string;
  region: string | null;
  socialLinks: SocialLinks;
}

function profileTabFromParam(value: string | null): ProfileTabId {
  if (value === "edit" || value === "settings") return value;
  return "overview";
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = profileTabFromParam(searchParams.get("tab"));

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [region, setRegion] = useState("");
  const [socialLinks, setSocialLinks] = useState<
    Record<SocialLinkPlatformId, string>
  >(socialLinksToFormState({}));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadProfile() {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile;
        if (!p) return;
        const links = (p.socialLinks ?? {}) as SocialLinks;
        setProfile({
          displayName: p.displayName,
          username: p.username,
          bio: p.bio ?? null,
          timezone: p.timezone,
          region: p.region ?? null,
          socialLinks: links,
        });
        setDisplayName(p.displayName ?? "");
        setUsername(p.username ?? "");
        setBio(p.bio ?? "");
        setTimezone(p.timezone ?? "UTC");
        setRegion(p.region ?? "");
        setSocialLinks(socialLinksToFormState(links));
      });
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveEditProfile(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        socialLinks,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.error ?? "Could not save profile";
      setError(
        msg.includes("duplicate") || msg.includes("unique")
          ? "That username is already taken. Try another."
          : msg
      );
      return;
    }
    setMessage("Profile saved.");
    loadProfile();
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timezone,
        region: region.trim() || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not save settings");
      return;
    }
    setMessage("Settings saved.");
    loadProfile();
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

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!profile) {
    return <p className="text-zinc-400">Loading profile…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <ProfileTabs active={tab} />

      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {tab === "overview" && (
        <div className="space-y-6">
          <PushRegistration />
          <div className="rounded-xl border border-zinc-800 p-4 space-y-2">
            <h2 className="text-xl font-semibold">{profile.displayName}</h2>
            <p className="text-emerald-400">@{profile.username}</p>
            {profile.bio ? (
              <p className="text-zinc-300 whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-zinc-500 text-sm italic">No bio yet.</p>
            )}
            <p className="text-xs text-zinc-500">Timezone: {profile.timezone}</p>
            <SocialLinksDisplay links={profile.socialLinks} />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link
              href={`/u/${profile.username}`}
              className="text-emerald-400 hover:underline"
            >
              View public profile →
            </Link>
            <Link href="/goals" className="text-emerald-400 hover:underline">
              Manage goals →
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
      )}

      {tab === "edit" && (
        <form onSubmit={saveEditProfile} className="space-y-4 max-w-md">
          <p className="text-sm text-zinc-500">
            Choose how you appear to others — like Instagram. Your public link is
            goalpost.app/u/yourname (on this site: /u/{username || "…"}).
          </p>
          <div>
            <label className="text-sm text-zinc-400">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={80}
              className="w-full mt-1 rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Username</label>
            <div className="flex mt-1 items-center rounded-lg bg-zinc-900 border border-zinc-700 overflow-hidden">
              <span className="pl-3 text-zinc-500 text-sm">@</span>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                required
                minLength={3}
                maxLength={30}
                pattern="[a-z0-9_]{3,30}"
                className="flex-1 bg-transparent px-2 py-2 outline-none"
              />
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              Lowercase letters, numbers, underscores only (3–30 chars).
            </p>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="What are you working toward? Share what you want followers to know."
              className="w-full mt-1 rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-2 resize-none"
            />
            <p className="text-xs text-zinc-600 mt-1 text-right">{bio.length}/300</p>
          </div>
          <SocialLinksEditor values={socialLinks} onChange={setSocialLinks} />
          <button
            type="submit"
            className="rounded-lg bg-emerald-500 text-zinc-950 font-semibold px-6 py-2"
          >
            Save profile
          </button>
        </form>
      )}

      {tab === "settings" && (
        <div className="max-w-md space-y-8">
          <form onSubmit={saveSettings} className="space-y-4">
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
              Save settings
            </button>
          </form>

          <div className="space-y-2 text-sm text-zinc-500">
            <p>Goal categories: {GOAL_CATEGORIES.join(", ")}</p>
            <Link href="/goals" className="text-emerald-400 hover:underline block">
              Manage goals →
            </Link>
          </div>

          <div className="border-t border-zinc-800 pt-6 space-y-3">
            <p className="text-sm text-zinc-400">
              GDPR / CCPA: request account deletion below.
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
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="text-zinc-400">Loading profile…</p>}>
      <ProfilePageContent />
    </Suspense>
  );
}
