"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatMessageTime } from "@/lib/format-datetime";

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<{
    displayName: string;
    username: string;
  } | null>(null);
  const [postContext, setPostContext] = useState<{
    id: string;
    photoUrl: string;
    caption: string | null;
  } | null>(null);
  const [body, setBody] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [isRequest, setIsRequest] = useState(false);
  const [canReply, setCanReply] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(() => {
    fetch(`/api/conversations/${id}/messages`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));
  }, [id]);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.userId ?? d.profile?.id ?? null));

    fetch(`/api/conversations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.otherUser) setOtherUser(d.otherUser);
        if (d.postContext) setPostContext(d.postContext);
        setIsRequest(Boolean(d.isRequest));
        setCanReply(Boolean(d.canReply));
      });

    loadMessages();
  }, [id, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError(null);

    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not send");
      return;
    }
    setBody("");
    setMessages((prev) => [...prev, data.message]);
  }

  async function acceptRequest() {
    setAccepting(true);
    setError(null);
    const res = await fetch(`/api/conversations/${id}/accept`, {
      method: "POST",
    });
    const data = await res.json();
    setAccepting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not accept");
      return;
    }
    setIsRequest(false);
    setCanReply(true);
  }

  async function declineRequest() {
    setDeclining(true);
    setError(null);
    const res = await fetch(`/api/conversations/${id}/decline`, {
      method: "POST",
    });
    const data = await res.json();
    setDeclining(false);
    if (!res.ok) {
      setError(data.error ?? "Could not decline");
      return;
    }
    router.push("/messages");
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-10rem)] -mx-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <div className="px-4 pb-3 border-b border-[var(--gp-border)] space-y-2">
        <Link href="/messages" className="gp-btn-text">
          ← Messages
        </Link>
        {otherUser && (
          <div>
            <Link
              href={`/u/${otherUser.username}`}
              className="gp-btn-text gp-btn-text-xs"
            >
              {otherUser.displayName}
            </Link>
            <p className="text-xs gp-text-muted">@{otherUser.username}</p>
          </div>
        )}
        {isRequest && (
          <p className="text-sm gp-text-muted">
            This is a message request. Accept to reply and move it to your inbox.
          </p>
        )}
        {postContext && (
          <div className="flex gap-3 items-center rounded-lg border border-[var(--gp-border)] p-2 bg-[var(--gp-surface)]">
            <img
              src={postContext.photoUrl}
              alt=""
              className="h-14 w-14 rounded object-cover shrink-0"
            />
            <p className="text-xs gp-text-muted line-clamp-2">
              {postContext.caption ?? "About this post"}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col max-w-[85%] ${
                  mine ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-accent text-accent-foreground"
                      : "bg-[var(--gp-surface)] text-[var(--gp-fg)]"
                  }`}
                >
                  {m.body}
                </div>
                <span className="text-[10px] gp-text-muted mt-0.5 px-1">
                  {formatMessageTime(m.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isRequest && !canReply ? (
        <div className="fixed left-0 right-0 z-20 px-4 py-3 border-t border-[var(--gp-border)] bg-[var(--gp-nav-bg)] backdrop-blur flex gap-2 max-w-3xl mx-auto bottom-[calc(3.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => void declineRequest()}
            disabled={declining || accepting}
            className="flex-1 rounded-lg border border-[var(--gp-border)] font-semibold py-2.5 disabled:opacity-50"
          >
            {declining ? "…" : "Decline"}
          </button>
          <button
            type="button"
            onClick={() => void acceptRequest()}
            disabled={accepting || declining}
            className="flex-1 rounded-lg bg-accent text-accent-foreground font-semibold py-2.5 disabled:opacity-50"
          >
            {accepting ? "…" : "Accept"}
          </button>
        </div>
      ) : (
        <form
          onSubmit={sendMessage}
          className="fixed left-0 right-0 z-20 px-4 py-3 border-t border-[var(--gp-border)] bg-[var(--gp-nav-bg)] backdrop-blur flex gap-2 max-w-3xl mx-auto bottom-[calc(3.5rem+env(safe-area-inset-bottom))]"
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message…"
            maxLength={2000}
            className="gp-input flex-1"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rounded-lg bg-accent text-accent-foreground font-semibold px-4 disabled:opacity-50 shrink-0"
          >
            Send
          </button>
        </form>
      )}
      {error && <p className="px-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
