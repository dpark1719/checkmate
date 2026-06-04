"use client";

import { useEffect, useState } from "react";

interface CommentAuthor {
  displayName: string;
  username: string;
}

interface Comment {
  id: string;
  body: string;
  author?: CommentAuthor;
  profiles?: { display_name: string; username: string };
}

function getAuthor(c: Comment): CommentAuthor {
  if (c.author) return c.author;
  return {
    displayName: c.profiles?.display_name ?? "Someone",
    username: c.profiles?.username ?? "user",
  };
}

export function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "Could not load comments");
        setComments([]);
        return;
      }
      setComments(data.comments ?? []);
    } catch {
      setLoadError("Could not load comments");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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
    const text = body.trim();
    if (!text) return;

    setSubmitting(true);
    setPostError(null);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPostError(data.error ?? "Could not post comment");
        return;
      }
      setBody("");
      if (data.comment) {
        setComments((prev) => [...prev, data.comment as Comment]);
      } else {
        await load();
      }
    } catch {
      setPostError("Could not post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 pb-4 pt-3 space-y-3 border-t border-[var(--gp-border)]">
      {loadError && (
        <p className="text-xs text-red-400">{loadError}</p>
      )}
      {loading ? (
        <p className="text-xs gp-text-muted">Loading comments…</p>
      ) : !loadError && comments.length === 0 ? (
        <p className="text-xs gp-text-muted">No comments yet.</p>
      ) : (
        comments.map((c) => {
          const author = getAuthor(c);
          return (
            <p key={c.id} className="text-sm">
              <span className="gp-text-muted">@{author.username} </span>
              {c.body}
            </p>
          );
        })
      )}
      {postError && <p className="text-xs text-red-400">{postError}</p>}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          disabled={submitting}
          className="flex-1 rounded-lg bg-[var(--gp-card)] border border-[var(--gp-border)] px-3 py-2 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="rounded-lg bg-[var(--gp-surface)] px-3 py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
