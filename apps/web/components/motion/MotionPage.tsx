"use client";

import { pageVariants, pageVariantsReduced, tweenFast } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";

export function MotionPage({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      variants={reduced ? pageVariantsReduced : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={reduced ? { duration: 0.15 } : tweenFast}
    >
      {children}
    </motion.div>
  );
}
