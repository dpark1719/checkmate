"use client";

import { LandingSteps } from "@/components/landing/LandingSteps";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import {
  MOCK_CATEGORY_CYCLE,
  MOCK_LEADERBOARD,
  MOCK_POSTS,
  MOCK_STATS,
} from "@/lib/landing/mockData";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

function ScrollDownCue({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1.5 gp-text-subtle hover:text-[var(--gp-muted)] transition-colors cursor-pointer"
      aria-label="Scroll to next section"
    >
      <ChevronDown className="h-5 w-5 landing-scroll-arrow" aria-hidden />
      <span className="text-xs tracking-wide uppercase">Scroll</span>
    </button>
  );
}

export function LandingPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = 4;

  const scrollToNext = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    for (let i = 0; i < pageRefs.current.length; i++) {
      const el = pageRefs.current[i];
      if (el && el.offsetTop > scrollTop + 20) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = pageRefs.current.findIndex((el) => el === entry.target);
          if (idx >= 0) setPageIndex(idx);
        }
      },
      {
        root: container,
        threshold: 0.55,
      }
    );

    for (const el of pageRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const showScrollCue = pageIndex < pageCount - 1;

  return (
    <div
      ref={containerRef}
      className="relative h-[100dvh] overflow-y-auto snap-y snap-mandatory scroll-smooth"
    >
      <div
        ref={(el) => {
          pageRefs.current[0] = el;
        }}
        className="snap-start min-h-[100dvh] flex flex-col items-center justify-center px-6"
      >
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
      </div>

      <div
        ref={(el) => {
          pageRefs.current[1] = el;
        }}
        className="snap-start min-h-[100dvh] flex flex-col justify-center"
      >
        <LandingSteps />
      </div>

      <div
        ref={(el) => {
          pageRefs.current[2] = el;
        }}
        className="snap-start min-h-[100dvh] flex flex-col justify-center"
      >
        <SocialProofSection
          stats={MOCK_STATS}
          categories={MOCK_CATEGORY_CYCLE}
          posts={MOCK_POSTS}
          leaderboard={MOCK_LEADERBOARD}
        />
      </div>

      <div
        ref={(el) => {
          pageRefs.current[3] = el;
        }}
        className="snap-start min-h-[100dvh] flex flex-col items-center justify-center px-6"
      >
        <div className="max-w-xl w-full text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to show up?
          </h2>
          <p className="gp-text-muted">
            Join thousands of people building streaks on CheckMate.
          </p>
          <AuthLinks />
        </div>
      </div>

      {showScrollCue && (
        <ScrollDownCue onClick={scrollToNext} />
      )}
    </div>
  );
}
