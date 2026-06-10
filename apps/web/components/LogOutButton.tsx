"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 text-xs font-medium gp-text-muted transition-colors hover:bg-[var(--gp-card)] hover:text-[var(--gp-fg)]"
      aria-label="Log out"
    >
      <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      <span className="hidden sm:inline">Log out</span>
    </button>
  );
}
