"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export default function ConversationPage() {
  const params = useParams();
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

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8rem)] -mx-4">
      <div className="px-4 pb-3 border-b border-zinc-800 space-y-2">
        <Link href="/messages" className="text-sm text-emerald-400 hover:underline">
          ← Messages
        </Link>
        {otherUser && (
          <div>
            <Link
              href={`/u/${otherUser.username}`}
              className="font-semibold hover:underline"
            >
              {otherUser.displayName}
            </Link>
            <p className="text-xs text-zinc-500">@{otherUser.username}</p>
          </div>
        )}
        {postContext && (
          <div className="flex gap-3 items-center rounded-lg border border-zinc-800 p-2 bg-zinc-900/50">
            <img
              src={postContext.photoUrl}
              alt=""
              className="h-14 w-14 rounded object-cover shrink-0"
            />
            <p className="text-xs text-zinc-400 line-clamp-2">
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
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="sticky bottom-0 px-4 py-3 border-t border-zinc-800 bg-zinc-950 flex gap-2"
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
          className="rounded-lg bg-emerald-500 text-zinc-950 font-semibold px-4 disabled:opacity-50 shrink-0"
        >
          Send
        </button>
      </form>
      {error && <p className="px-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
