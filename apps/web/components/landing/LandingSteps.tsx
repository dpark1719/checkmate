"use client";

import { useInView } from "@/lib/use-in-view";

const STEPS = [
  {
    title: "Set a goal.",
    body: "Studying, running, relationships.",
  },
  {
    title: "Commit to a time.",
    body: "We'll hold you to it.",
  },
  {
    title: "Post your commit.",
    body: "Keep each other accountable.",
  },
] as const;

export function LandingSteps() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={`min-h-[70dvh] py-16 sm:py-24 px-6 max-w-xl mx-auto w-full ${
        inView ? "landing-steps-visible" : ""
      }`}
    >
      <h2
        className="landing-step text-xl sm:text-2xl font-bold mb-10"
        style={{ transitionDelay: "0ms" }}
      >
        Three steps, dead simple:
      </h2>

      <ol className="space-y-6">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="landing-step flex gap-4 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-card)] p-5"
            style={{ transitionDelay: `${(index + 1) * 140}ms` }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold bg-[var(--gp-accent-subtle)] text-accent"
              aria-hidden
            >
              {index + 1}
            </span>
            <p className="text-base sm:text-lg leading-relaxed pt-0.5">
              <span className="font-semibold text-[var(--gp-fg)]">
                {step.title}
              </span>{" "}
              <span className="gp-text-muted">— {step.body}</span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
