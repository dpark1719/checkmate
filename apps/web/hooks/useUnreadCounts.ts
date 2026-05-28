"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export interface UnreadCounts {
  messages: number;
  comments: number;
  total: number;
}

const empty: UnreadCounts = { messages: 0, comments: 0, total: 0 };

export function useUnreadCounts(pollMs = 30_000) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<UnreadCounts>(empty);

  const refresh = useCallback(() => {
    fetch("/api/notifications/unread")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.messages === "number") {
          setCounts({
            messages: d.messages,
            comments: d.comments ?? 0,
            total: d.total ?? d.messages + (d.comments ?? 0),
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    const onChange = () => refresh();
    window.addEventListener("checkmate:notifications-changed", onChange);
    return () => {
      clearInterval(id);
      window.removeEventListener("checkmate:notifications-changed", onChange);
    };
  }, [refresh, pollMs, pathname]);

  return { counts, refresh };
}

export function formatBadgeCount(n: number): string | null {
  if (n <= 0) return null;
  return n > 9 ? "9+" : String(n);
}
