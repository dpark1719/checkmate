"use client";

import { useEffect, useState } from "react";

interface Comment {
  id: string;
  body: string;
  profiles?: { display_name: string; username: string };
}

export function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "comments", postId }),
    })
      .then(() => {
        window.dispatchEvent(new Event("checkmate:notifications-changed"));
      })
      .catch(() => {});
  }, [postId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      setBody("");
      load();
    }
  }

  return (
    <div className="px-4 pb-4 space-y-3">
      {loading ? (
        <p className="text-xs gp-text-muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs gp-text-muted">No comments yet.</p>
      ) : (
        comments.map((c) => (
          <p key={c.id} className="text-sm">
            <span className="gp-text-muted">
              @{c.profiles?.username ?? "user"}{" "}
            </span>
            {c.body}
          </p>
        ))
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--gp-surface)] px-3 py-2 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  );
}
