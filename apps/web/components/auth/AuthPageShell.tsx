import Link from "next/link";

export function AuthPageShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--gp-accent-subtle) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-block text-accent font-bold text-4xl tracking-tight hover:opacity-90 transition-opacity"
          >
            CheckMate
          </Link>
          <p className="text-sm gp-text-muted">Social media for doers.</p>
        </div>

        <div className="rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-card)] p-8 shadow-lg shadow-black/20 space-y-6">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm gp-text-muted">{footer}</p>
        )}
      </div>
    </div>
  );
}
