import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export function AppNav() {
  return (
    <header className="border-b border-[var(--gp-border)] bg-[var(--gp-nav-bg)] backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-12 gap-3">
        <Link
          href="/feed"
          className="font-bold text-accent shrink-0 tracking-tight"
        >
          GoalPost
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
