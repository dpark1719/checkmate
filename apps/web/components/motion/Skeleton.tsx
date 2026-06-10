"use client";

import { motion, useReducedMotion } from "framer-motion";

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      className={`rounded-lg bg-[var(--gp-surface)] ${className}`}
      animate={reduced ? { opacity: 0.7 } : { opacity: [0.55, 0.85, 0.55] }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}
