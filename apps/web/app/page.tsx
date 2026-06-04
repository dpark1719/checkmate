import { LandingSteps } from "@/components/landing/LandingSteps";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

function AuthLinks() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link
        href="/signup"
        className="rounded-full bg-accent text-accent-foreground font-semibold px-8 py-3 hover:opacity-90 transition text-center"
      >
        Get started
      </Link>
      <Link
        href="/login"
        className="rounded-full border border-[var(--gp-border)] px-8 py-3 hover:bg-[var(--gp-card)] transition text-center"
      >
        Log in
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6">
        <div className="max-w-lg text-center space-y-6">
          <p className="text-accent font-semibold tracking-wide uppercase text-sm">
            CheckMate
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            One photo. One promise. Every day.
          </h1>
          <p className="gp-text-muted text-lg">Social media for doers.</p>
          <div className="pt-4">
            <AuthLinks />
          </div>
        </div>

        <div className="absolute bottom-8 flex flex-col items-center gap-1.5">
          <ChevronDown
            className="h-5 w-5 gp-text-subtle landing-scroll-arrow"
            aria-hidden
          />
          <p className="text-xs gp-text-subtle tracking-wide uppercase">
            Scroll
          </p>
        </div>
      </section>

      <LandingSteps />

      <section className="pb-16 px-6 max-w-xl mx-auto w-full text-center">
        <AuthLinks />
      </section>
    </div>
  );
}
