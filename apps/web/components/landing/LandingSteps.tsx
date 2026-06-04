"use client";

import { useInView } from "@/lib/use-in-view";

const STEPS = [
  {
    title: "Set a goal.",
    body: "Studying, running, relationships. Everyone has one.",
  },
  {
    title: "Commit to a time.",
    body: "You don't rise to your goals. You fall to your systems.",
  },
  {
    title: "Post your progress.",
    body: "Show up small. Compound big.",
  },
  {
    title: "Join a community.",
    body: "You are the average of who you surround yourself with. Choose wisely.",
  },
] as const;

export function LandingSteps() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={`min-h-[100dvh] py-10 sm:py-12 px-6 max-w-xl mx-auto w-full flex flex-col justify-center ${
        inView ? "landing-steps-visible" : ""
      }`}
    >
      <h2
        className="landing-step text-xl sm:text-2xl font-bold mb-6 sm:mb-8"
        style={{ transitionDelay: "0ms" }}
      >
        Four steps, dead simple:
      </h2>

      <ol className="space-y-3 sm:space-y-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="landing-step flex gap-3 sm:gap-4 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-card)] p-4 sm:p-5"
            style={{ transitionDelay: `${(index + 1) * 140}ms` }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold bg-[var(--gp-accent-subtle)] text-accent"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="text-sm sm:text-base leading-relaxed pt-0.5 space-y-1">
              <p className="font-semibold text-[var(--gp-fg)]">{step.title}</p>
              <p className="gp-text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
