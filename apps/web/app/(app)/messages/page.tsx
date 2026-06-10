"use client";

import { MessagesSkeleton } from "@/components/PageSkeletons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMessageTime } from "@/lib/format-datetime";

interface ConversationRow {
  id: string;
  updatedAt: string;
  unread: boolean;
  isRequest?: boolean;
  otherUser: {
    displayName: string;
    username: string;
  } | null;
  lastMessage: {
    body: string | null;
    previewHidden?: boolean;
    createdAt: string;
    senderId: string;
  } | null;
}

function ConversationListItem({
  conversation,
  isRequest,
}: {
  conversation: ConversationRow;
  isRequest?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/messages/${conversation.id}`}
        className={`block rounded-xl border px-4 py-3 hover:bg-[var(--gp-card)]/50 ${
          conversation.unread && !isRequest
            ? "border-accent/50 bg-[var(--gp-accent-subtle)]"
            : isRequest
              ? "border-accent/30 bg-[var(--gp-accent-subtle)]/40"
              : "border-[var(--gp-border)]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium truncate">
            {conversation.otherUser?.displayName ?? "User"}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {conversation.lastMessage && (
              <span className="text-[10px] gp-text-muted">
                {formatMessageTime(conversation.lastMessage.createdAt)}
              </span>
            )}
            {conversation.unread && !isRequest && (
              <span className="h-2 w-2 rounded-full bg-accent" />
            )}
          </div>
        </div>
        {isRequest ? (
          <p className="text-sm gp-text-muted mt-1 italic">New message request</p>
        ) : (
          conversation.lastMessage?.body && (
            <p className="text-sm gp-text-muted mt-1 truncate">
              {conversation.lastMessage.body}
            </p>
          )
        )}
      </Link>
    </li>
  );
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [requests, setRequests] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setLoadError(d.error ?? "Could not load messages");
          return;
        }
        setConversations(d.conversations ?? []);
        setRequests(d.requests ?? []);
      })
      .catch(() => setLoadError("Could not load messages"))
      .finally(() => setLoading(false));
  }, []);

  const empty = conversations.length === 0 && requests.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <p className="text-sm text-[var(--gp-muted)]">
        Message someone from their profile, or tap a post on Home and choose{" "}
        <strong className="text-[var(--gp-fg)]">Message about this post</strong>.
      </p>

      {loadError && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 space-y-2">
          <p className="text-sm text-red-400">{loadError}</p>
          <p className="text-xs gp-text-muted">
            If messaging was recently added, run{" "}
            <code className="text-[var(--gp-fg)]">
              supabase/migrations/20250602120000_message_requests.sql
            </code>{" "}
            in Supabase, then check{" "}
            <Link href="/api/conversations/health" className="gp-btn-text gp-btn-text-xs">
              /api/conversations/health
            </Link>
            .
          </p>
        </div>
      )}

      {loading ? (
        <MessagesSkeleton />
      ) : loadError ? null : empty ? (
        <p className="gp-text-muted text-sm">
          No conversations yet.{" "}
          <Link href="/discover" className="gp-btn-text gp-btn-text-xs">
            Browse communities
          </Link>{" "}
          or visit a profile and tap Message.
        </p>
      ) : (
        <div className="space-y-8">
          {requests.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Message requests</h2>
                <span className="rounded-full bg-accent/20 text-accent text-xs font-medium px-2 py-0.5">
                  {requests.length}
                </span>
              </div>
              <ul className="space-y-2">
                {requests.map((c) => (
                  <ConversationListItem
                    key={c.id}
                    conversation={c}
                    isRequest
                  />
                ))}
              </ul>
            </section>
          )}

          {conversations.length > 0 && (
            <section className="space-y-3">
              {requests.length > 0 && (
                <h2 className="text-lg font-semibold">Messages</h2>
              )}
              <ul className="space-y-2">
                {conversations.map((c) => (
                  <ConversationListItem key={c.id} conversation={c} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
