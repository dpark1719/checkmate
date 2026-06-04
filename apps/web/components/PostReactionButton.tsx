"use client";

import { UserAvatar } from "@/components/UserAvatar";
import {
  reactionEmoji,
  type ReactionType,
} from "@checkmate/shared";
import {
  type ReactionRow,
  reactionsForType,
  userHasReaction,
} from "@/lib/reactions";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Reactor {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export function PostReactionButton({
  postId,
  type,
  reactions,
  currentUserId,
  onToggle,
}: {
  postId: string;
  type: ReactionType;
  reactions: ReactionRow[];
  currentUserId: string | null;
  onToggle: (type: ReactionType) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [reactors, setReactors] = useState<Reactor[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  const active = userHasReaction(reactions, type, currentUserId);
  const count = reactionsForType(reactions, type).length;

  const loadReactors = useCallback(async () => {
    if (count === 0) return;
    if (fetchedRef.current) return;

    setLoadingReactors(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/reactions?type=${encodeURIComponent(type)}`
      );
      const data = await res.json();
      if (res.ok) {
        setReactors(data.reactors ?? []);
        fetchedRef.current = true;
      }
    } finally {
      setLoadingReactors(false);
    }
  }, [count, postId, type]);

  function openPopover() {
    if (count === 0) return;
    setPopoverOpen(true);
    void loadReactors();
  }

  function closePopover() {
    setPopoverOpen(false);
  }

  useEffect(() => {
    if (!popoverOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closePopover();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [popoverOpen]);

  useEffect(() => {
    fetchedRef.current = false;
    setReactors(null);
  }, [postId, type, count]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseLeave={() => closePopover()}
    >
      {popoverOpen && count > 0 && (
        <div
          className="absolute bottom-full left-0 mb-2 z-20 min-w-[10rem] max-w-[14rem] rounded-lg border border-[var(--gp-border)] bg-[var(--gp-card)] shadow-lg py-1 max-h-32 overflow-y-auto"
          role="tooltip"
        >
          {loadingReactors ? (
            <p className="px-3 py-2 text-xs gp-text-muted">Loading…</p>
          ) : reactors && reactors.length > 0 ? (
            <ul>
              {reactors.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/u/${r.username}`}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--gp-surface)] text-sm"
                    onClick={() => closePopover()}
                  >
                    <UserAvatar
                      displayName={r.displayName}
                      avatarUrl={r.avatarUrl}
                      size="sm"
                    />
                    <span className="truncate">{r.displayName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-xs gp-text-muted">No reactions</p>
          )}
        </div>
      )}

      <div
        className={`text-xl rounded-full min-w-[2.5rem] h-10 px-2 border flex items-center justify-center gap-1 ${
          active
            ? "border-accent bg-[var(--gp-accent-subtle)]"
            : "border-[var(--gp-border)] opacity-80 hover:opacity-100"
        }`}
        onMouseEnter={() => {
          if (count > 0) openPopover();
        }}
      >
        <button
          type="button"
          title={type}
          aria-label={type}
          onClick={() => {
            if (!currentUserId) return;
            onToggle(type);
          }}
          disabled={!currentUserId}
          className="flex items-center justify-center disabled:opacity-50"
        >
          <span aria-hidden>{reactionEmoji(type)}</span>
        </button>
        {count > 0 && (
          <button
            type="button"
            aria-label={`${count} ${type} reactions`}
            className="text-xs gp-text-muted tabular-nums px-0.5 min-w-[1ch] hover:text-[var(--gp-fg)]"
            onClick={(e) => {
              e.stopPropagation();
              if (popoverOpen) closePopover();
              else openPopover();
            }}
            onMouseEnter={(e) => e.stopPropagation()}
          >
            {count}
          </button>
        )}
      </div>
    </div>
  );
}
