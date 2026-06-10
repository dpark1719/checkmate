import type { Transition, Variants } from "framer-motion";

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const tweenFast: Transition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const pageVariantsReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalPanelVariants: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
};

export const modalPanelVariantsReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const staggerContainerVariants: Variants = {
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export const staggerItemVariantsReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export function hoverTapProps(reduced: boolean) {
  if (reduced) return {};
  return {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
  };
}
