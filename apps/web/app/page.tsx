import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-6">
        <p className="text-emerald-400 font-semibold tracking-wide uppercase text-sm">
          GoalPost
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          One photo. One promise. Every day.
        </h1>
        <p className="text-zinc-400 text-lg">
          Social media for doers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-500 text-zinc-950 font-semibold px-8 py-3 hover:bg-emerald-400 transition"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-700 px-8 py-3 hover:bg-zinc-900 transition"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
