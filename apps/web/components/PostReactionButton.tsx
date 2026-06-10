"use client";

import { Skeleton } from "@/components/motion/Skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { springSnappy, tweenFast } from "@/lib/motion";
import {
  reactionEmoji,
  type ReactionType,
} from "@checkmate/shared";
import {
  type ReactionRow,
  reactionsForType,
  userHasReaction,
} from "@/lib/reactions";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  const reduced = useReducedMotion() ?? false;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [reactors, setReactors] = useState<Reactor[] | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);
  const [justToggled, setJustToggled] = useState<"add" | "remove" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = userHasReaction(reactions, type, currentUserId);
  const count = reactionsForType(reactions, type).length;
  const showReactorsOnHover = count > 0;

  const loadReactors = useCallback(async () => {
    if (count === 0) return;

    setLoadingReactors(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/reactions?type=${encodeURIComponent(type)}`
      );
      const data = await res.json();
      if (res.ok) {
        setReactors(data.reactors ?? []);
      }
    } finally {
      setLoadingReactors(false);
    }
  }, [count, postId, type]);

  function openPopover() {
    if (!showReactorsOnHover) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setPopoverOpen(true);
    void loadReactors();
  }

  function scheduleClosePopover() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setPopoverOpen(false);
      closeTimerRef.current = null;
    }, 120);
  }

  function handleToggle() {
    if (!currentUserId) return;
    const wasActive = active;
    onToggle(type);
    setJustToggled(wasActive ? "remove" : "add");
    window.setTimeout(() => setJustToggled(null), 300);
  }

  useEffect(() => {
    setReactors(null);
  }, [postId, type, count]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const emojiAnimate = reduced
    ? {}
    : justToggled === "add"
      ? { scale: [1, 1.45, 1] }
      : justToggled === "remove"
        ? { scale: 0.85 }
        : undefined;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openPopover}
      onMouseLeave={scheduleClosePopover}
      onFocusCapture={openPopover}
      onBlurCapture={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
          scheduleClosePopover();
        }
      }}
    >
      <AnimatePresence>
        {popoverOpen && showReactorsOnHover && (
          <div
            className="absolute bottom-full left-0 z-20 pb-2"
            onMouseEnter={openPopover}
            onMouseLeave={scheduleClosePopover}
          >
            <motion.div
              className="min-w-[10rem] max-w-[14rem] rounded-lg border border-[var(--gp-border)] bg-[var(--gp-card)] shadow-lg py-1 max-h-32 overflow-y-auto"
              role="tooltip"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: reduced ? 0.1 : 0.18 }}
            >
              {loadingReactors ? (
                <div className="px-3 py-2 space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                </div>
              ) : reactors && reactors.length > 0 ? (
                <ul>
                  {reactors.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/u/${r.username}`}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--gp-surface)] text-sm"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        className={`text-xl rounded-full min-w-[2.5rem] h-10 px-2 border flex items-center justify-center gap-1 ${
          active
            ? "border-accent bg-[var(--gp-accent-subtle)]"
            : "border-[var(--gp-border)] opacity-80 hover:opacity-100"
        } ${showReactorsOnHover ? "cursor-default" : ""}`}
        animate={
          justToggled === "add" && !reduced
            ? { boxShadow: "0 0 0 4px color-mix(in srgb, var(--gp-accent) 35%, transparent)" }
            : { boxShadow: "0 0 0 0px transparent" }
        }
        transition={{ duration: 0.3 }}
      >
        <button
          type="button"
          title={type}
          aria-label={type}
          onClick={handleToggle}
          disabled={!currentUserId}
          className="flex items-center justify-center disabled:opacity-50"
        >
          <motion.span
            aria-hidden
            whileHover={reduced ? undefined : { scale: 1.2, rotate: [-8, 8, 0] }}
            animate={emojiAnimate}
            transition={{
              scale:
                justToggled === "add"
                  ? tweenFast
                  : justToggled === "remove"
                    ? springSnappy
                    : springSnappy,
              rotate: tweenFast,
            }}
          >
            {reactionEmoji(type)}
          </motion.span>
        </button>
        {count > 0 && (
          <span
            aria-label={`${count} ${type} reactions`}
            className="text-xs gp-text-muted tabular-nums px-0.5 min-w-[1ch] select-none"
          >
            {count}
          </span>
        )}
      </motion.div>
    </div>
  );
}
