"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ConversationRow {
  id: string;
  updatedAt: string;
  unread: boolean;
  otherUser: {
    displayName: string;
    username: string;
  } | null;
  lastMessage: {
    body: string;
    createdAt: string;
    senderId: string;
  } | null;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        setConversations(d.conversations ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <p className="text-sm text-[var(--gp-muted)]">
        Tap a post photo on Home or in a community feed, then choose{" "}
        <strong className="text-[var(--gp-fg)]">Message about this post</strong>.
      </p>

      {loading ? (
        <p className="gp-text-muted">Loading…</p>
      ) : conversations.length === 0 ? (
        <p className="gp-text-muted text-sm">
          No conversations yet.{" "}
          <Link href="/discover" className="text-accent underline">
            Browse communities
          </Link>{" "}
          and tap a post to message someone.
        </p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className={`block rounded-xl border px-4 py-3 hover:bg-[var(--gp-card)]/50 ${
                  c.unread
                    ? "border-accent/50 bg-[var(--gp-accent-subtle)]"
                    : "border-[var(--gp-border)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">
                    {c.otherUser?.displayName ?? "User"}
                  </p>
                  {c.unread && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>
                <p className="text-xs gp-text-muted">@{c.otherUser?.username}</p>
                {c.lastMessage && (
                  <p className="text-sm gp-text-muted mt-1 truncate">
                    {c.lastMessage.body}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
