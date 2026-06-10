"use client";

import { hoverTapProps } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import type { ComponentProps } from "react";

type MotionButtonProps = ComponentProps<typeof motion.button>;

export function MotionButton({ children, ...props }: MotionButtonProps) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.button {...hoverTapProps(reduced)} transition={{ duration: 0.15 }} {...props}>
      {children}
    </motion.button>
  );
}
