"use client";

import { useEffect, useState } from "react";

export function PromiseCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [remaining, setRemaining] = useState<string | null>(null);
  const [late, setLate] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    function tick() {
      const diff = new Date(expiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Window closed — post will count as late");
        setLate(true);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
      setLate(false);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt || !remaining) return null;

  return (
    <p
      className={`text-sm font-mono ${late ? "text-amber-500" : "text-accent"}`}
    >
      {remaining}
    </p>
  );
}
