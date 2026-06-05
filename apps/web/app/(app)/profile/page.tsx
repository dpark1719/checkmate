"use client";

import { AvatarUpload } from "@/components/AvatarUpload";
import { CityTimezonePicker } from "@/components/CityTimezonePicker";
import { ProfileTabs, type ProfileTabId } from "@/components/ProfileTabs";
import { UserAvatar } from "@/components/UserAvatar";
import { PushRegistration } from "@/components/PushRegistration";
import {
  SocialLinksEditor,
  socialLinksToFormState,
} from "@/components/SocialLinksEditor";
import { ProfileConnections } from "@/components/ProfileConnections";
import { ProfilePostsGallery } from "@/components/ProfilePostsGallery";
import { ProfileActivityHeatmap } from "@/components/ProfileActivityHeatmap";
import { SocialLinksDisplay } from "@/components/SocialLinksDisplay";
import {
  GOAL_CATEGORIES,
  type SocialLinkPlatformId,
  type SocialLinks,
} from "@checkmate/shared";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface Profile {
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string;
  timezoneLabel: string | null;
  region: string | null;
  socialLinks: SocialLinks;
}

function profileTabFromParam(value: string | null): ProfileTabId {
  if (value === "edit" || value === "settings") return value;
  return "overview";
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const tab = profileTabFromParam(searchParams.get("tab"));

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [timezoneLabel, setTimezoneLabel] = useState<string | null>(null);
  const [region, setRegion] = useState("");
  const [socialLinks, setSocialLinks] = useState<
    Record<SocialLinkPlatformId, string>
  >(socialLinksToFormState({}));
  const [emailComments, setEmailComments] = useState(true);
  const [emailMessages, setEmailMessages] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadProfile() {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setUserId(data.userId ?? data.profile?.id ?? null);
        const p = data.profile;
        if (!p) return;
        const links = (p.socialLinks ?? {}) as SocialLinks;
        setProfile({
          displayName: p.displayName,
          username: p.username,
          bio: p.bio ?? null,
          avatarUrl: p.avatarUrl ?? null,
          timezone: p.timezone,
          timezoneLabel: p.timezoneLabel ?? null,
          region: p.region ?? null,
          socialLinks: links,
        });
        setAvatarUrl(p.avatarUrl ?? null);
        setDisplayName(p.displayName ?? "");
        setUsername(p.username ?? "");
        setBio(p.bio ?? "");
        setTimezone(p.timezone ?? "UTC");
        setTimezoneLabel(p.timezoneLabel ?? null);
        setRegion(p.region ?? "");
        setSocialLinks(socialLinksToFormState(links));
        const prefs = (p.notificationPreferences ?? {}) as Record<
          string,
          unknown
        >;
        setEmailComments(prefs.emailComments !== false);
        setEmailMessages(prefs.emailMessages !== false);
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

    if (!timezone || !timezoneLabel) {
      setError("Please select your city from the list.");
      return;
    }

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timezone,
        timezoneLabel,
        region: region.trim() || null,
        notificationPreferences: {
          emailComments,
          emailMessages,
        },
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

  if (!profile) {
    return <p className="gp-text-muted">Loading profile…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <ProfileTabs active={tab} />

      {message && <p className="text-sm text-accent">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {tab === "overview" && (
        <div className="space-y-6">
          <PushRegistration />
          <div className="rounded-xl border border-[var(--gp-border)] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <UserAvatar
                  displayName={profile.displayName}
                  avatarUrl={profile.avatarUrl}
                  size="lg"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold truncate">
                    {profile.displayName}
                  </h2>
                  <p className="text-accent truncate">@{profile.username}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm items-end shrink-0">
                <Link
                  href={`/u/${profile.username}`}
                  className="gp-btn-text gp-btn-text-xs text-right whitespace-nowrap"
                >
                  View public profile →
                </Link>
                <Link
                  href="/goals"
                  className="gp-btn-text gp-btn-text-xs text-right whitespace-nowrap"
                >
                  Manage goals →
                </Link>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-1 min-w-0 space-y-3">
                {profile.bio ? (
                  <p className="text-[var(--gp-fg)] whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="gp-text-muted text-sm italic">No bio yet.</p>
                )}
                <p className="text-xs gp-text-muted">
                  {profile.timezoneLabel
                    ? `${profile.timezoneLabel} (${profile.timezone})`
                    : `Timezone: ${profile.timezone}`}
                </p>
                <SocialLinksDisplay links={profile.socialLinks} />
              </div>
              <div className="w-full max-w-[180px] ml-auto shrink-0">
                <ProfileActivityHeatmap username={profile.username} />
              </div>
            </div>
          </div>

          <ProfileConnections
            username={profile.username}
            currentUserId={userId}
          />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Posts</h2>
            <ProfilePostsGallery username={profile.username} />
          </section>

        </div>
      )}

      {tab === "edit" && (
        <form onSubmit={saveEditProfile} className="space-y-4 max-w-md">
          <p className="text-sm gp-text-muted">
            Choose how you appear to others — like Instagram. Your public link is
            checkmate.app/u/yourname (on this site: /u/{username || "…"}).
          </p>
          <AvatarUpload
            displayName={displayName || profile.displayName}
            avatarUrl={avatarUrl}
            onUpdated={(url) => {
              setAvatarUrl(url);
              setProfile((prev) =>
                prev ? { ...prev, avatarUrl: url } : prev
              );
            }}
          />
          <div>
            <label className="text-sm gp-text-muted">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={80}
              className="w-full mt-1 rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm gp-text-muted">Username</label>
            <div className="flex mt-1 items-center rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] overflow-hidden">
              <span className="pl-3 gp-text-muted text-sm">@</span>
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
            <p className="text-xs gp-text-subtle mt-1">
              Lowercase letters, numbers, underscores only (3–30 chars).
            </p>
          </div>
          <div>
            <label className="text-sm gp-text-muted">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="What are you working toward? Share what you want followers to know."
              className="w-full mt-1 rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-4 py-2 resize-none"
            />
            <p className="text-xs gp-text-subtle mt-1 text-right">{bio.length}/300</p>
          </div>
          <SocialLinksEditor values={socialLinks} onChange={setSocialLinks} />
          <button
            type="submit"
            className="rounded-lg bg-accent text-accent-foreground font-semibold px-6 py-2"
          >
            Save profile
          </button>
        </form>
      )}

      {tab === "settings" && (
        <div className="max-w-md space-y-8">
          <form onSubmit={saveSettings} className="space-y-4">
            <CityTimezonePicker
              timezone={timezone}
              timezoneLabel={timezoneLabel}
              prefillTimezone={timezoneLabel ? null : timezone}
              onChange={({ timezone: tz, timezoneLabel: label }) => {
                setTimezone(tz);
                setTimezoneLabel(label);
              }}
            />
            <div>
              <label className="text-sm gp-text-muted">Country (region code)</label>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="US"
                className="w-full mt-1 gp-input"
              />
            </div>
            <div className="border-t border-[var(--gp-border)] pt-4 space-y-3">
              <p className="text-sm font-medium text-[var(--gp-fg)]">Email alerts</p>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={emailComments}
                  onChange={(e) => setEmailComments(e.target.checked)}
                  className="rounded"
                />
                New comments on my posts
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={emailMessages}
                  onChange={(e) => setEmailMessages(e.target.checked)}
                  className="rounded"
                />
                New direct messages
              </label>
              <p className="text-xs text-[var(--gp-muted)]">
                Requires Resend (<code className="text-xs">RESEND_API_KEY</code>) on
                the server. In-app badges work without email.
              </p>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-accent text-accent-foreground font-semibold px-6 py-2"
            >
              Save settings
            </button>
          </form>

          <div className="space-y-2 text-sm gp-text-muted">
            <p>Goal categories: {GOAL_CATEGORIES.join(", ")}</p>
            <Link href="/goals" className="gp-btn-text gp-btn-text-block">
              Manage goals →
            </Link>
          </div>

          <div className="border-t border-[var(--gp-border)] pt-6 space-y-3">
            <p className="text-sm gp-text-muted">
              GDPR / CCPA: request account deletion below.
            </p>
            <button
              type="button"
              onClick={deleteAccount}
              className="gp-btn-text-danger"
            >
              Delete my account
            </button>
            <a
              href="mailto:support@checkmate.app?subject=Report%20a%20problem"
              className="gp-btn-text-neutral gp-btn-text-block"
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
    <Suspense fallback={<p className="gp-text-muted">Loading profile…</p>}>
      <ProfilePageContent />
    </Suspense>
  );
}
