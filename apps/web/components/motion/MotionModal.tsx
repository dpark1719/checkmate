"use client";

import {
  modalBackdropVariants,
  modalPanelVariants,
  modalPanelVariantsReduced,
  springSnappy,
  tweenFast,
} from "@/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function AnimatedModalRoot({
  onClose,
  children,
  panelClassName = "",
  align = "center",
  ariaLabelledBy,
}: {
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  align?: "center" | "bottom";
  ariaLabelledBy?: string;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex justify-center p-0 sm:p-4 bg-black/70 ${
        align === "bottom" ? "items-end sm:items-center" : "items-center"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={modalBackdropVariants}
      transition={tweenFast}
      onClick={onClose}
    >
      <motion.div
        className={panelClassName}
        variants={reduced ? modalPanelVariantsReduced : modalPanelVariants}
        transition={reduced ? { duration: 0.15 } : springSnappy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function MotionModal({
  open,
  onClose,
  children,
  panelClassName = "",
  align = "center",
  ariaLabelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  align?: "center" | "bottom";
  ariaLabelledBy?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <AnimatedModalRoot
          onClose={onClose}
          panelClassName={panelClassName}
          align={align}
          ariaLabelledBy={ariaLabelledBy}
        >
          {children}
        </AnimatedModalRoot>
      )}
    </AnimatePresence>
  );
}
