import Link from "next/link";

export function AppNav() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-12">
        <Link href="/feed" className="font-bold text-emerald-400">
          GoalPost
        </Link>
        <div className="flex gap-3 text-sm">
          <Link href="/streaks" className="text-zinc-400 hover:text-zinc-50">
            Streaks
          </Link>
          <Link href="/goals" className="text-zinc-400 hover:text-zinc-50">
            Goals
          </Link>
        </div>
      </div>
    </header>
  );
}
