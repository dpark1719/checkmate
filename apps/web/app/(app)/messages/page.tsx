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
        <p className="text-zinc-500">Loading…</p>
      ) : conversations.length === 0 ? (
        <p className="text-zinc-500 text-sm">
          No conversations yet.{" "}
          <Link href="/discover" className="text-emerald-400 underline">
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
                className={`block rounded-xl border px-4 py-3 hover:bg-zinc-900/50 ${
                  c.unread
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">
                    {c.otherUser?.displayName ?? "User"}
                  </p>
                  {c.unread && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-zinc-500">@{c.otherUser?.username}</p>
                {c.lastMessage && (
                  <p className="text-sm text-zinc-400 mt-1 truncate">
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
