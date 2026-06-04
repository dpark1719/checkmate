"use client";

import { UserAvatar } from "@/components/UserAvatar";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Connection {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isFollowing: boolean;
}

export function ProfileConnections({
  username,
  currentUserId,
}: {
  username: string;
  currentUserId?: string | null;
}) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}/connections`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setConnections([]);
          return;
        }
        setConnections(d.connections ?? []);
      })
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  }, [username]);

  async function connect(userId: string) {
    setConnectingId(userId);
    const res = await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: userId }),
    });
    setConnectingId(null);
    if (res.ok) {
      setConnections((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, isFollowing: true } : c))
      );
    }
  }

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Connections</h2>
        <p className="text-sm gp-text-muted">Loading…</p>
      </section>
    );
  }

  if (connections.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Connections</h2>
        <p className="text-sm gp-text-muted">No connections yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Connections</h2>
      <ul className="space-y-2">
        {connections.map((c) => {
          const isSelf = currentUserId === c.id;
          const showConnect =
            currentUserId && !isSelf && !c.isFollowing;

          return (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--gp-border)] px-3 py-2.5"
            >
              <Link
                href={`/u/${c.username}`}
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <UserAvatar
                  displayName={c.displayName}
                  avatarUrl={c.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.displayName}</p>
                  <p className="text-xs gp-text-muted truncate">
                    @{c.username}
                  </p>
                </div>
              </Link>
              {isSelf ? (
                <span className="text-xs gp-text-muted shrink-0">You</span>
              ) : c.isFollowing ? (
                <span className="text-xs gp-text-muted shrink-0">Connected</span>
              ) : showConnect ? (
                <button
                  type="button"
                  onClick={() => void connect(c.id)}
                  disabled={connectingId === c.id}
                  className="gp-btn-text gp-btn-text-xs shrink-0 disabled:opacity-50"
                >
                  {connectingId === c.id ? "…" : "Connect"}
                </button>
              ) : !currentUserId ? (
                <Link
                  href="/login"
                  className="gp-btn-text gp-btn-text-xs shrink-0"
                >
                  Connect
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
