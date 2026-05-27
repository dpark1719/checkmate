import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-6">
        <p className="text-accent font-semibold tracking-wide uppercase text-sm">
          GoalPost
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          One photo. One promise. Every day.
        </h1>
        <p className="gp-text-muted text-lg">
          Social media for doers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/signup"
            className="rounded-full bg-accent text-accent-foreground font-semibold px-8 py-3 hover:opacity-90 transition"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--gp-border)] px-8 py-3 hover:bg-[var(--gp-card)] transition"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
