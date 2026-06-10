"use client";

import {
  staggerContainerVariants,
  staggerItemVariants,
  staggerItemVariantsReduced,
  tweenFast,
} from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";

type MotionTag = keyof typeof motion;

export function StaggerList({
  children,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: MotionTag;
}) {
  const Component = motion[as] as typeof motion.div;

  return (
    <Component
      className={className}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: MotionTag;
}) {
  const reduced = useReducedMotion() ?? false;
  const Component = motion[as] as typeof motion.div;

  return (
    <Component
      className={className}
      variants={reduced ? staggerItemVariantsReduced : staggerItemVariants}
      transition={tweenFast}
    >
      {children}
    </Component>
  );
}
