"use client";

import { useTheme } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";
import { tweenFast } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

const options: {
  value: ThemeMode;
  label: string;
  Icon: typeof Sun;
}[] = [
  { value: "light", label: "Light mode", Icon: Sun },
  { value: "dark", label: "Dark mode", Icon: Moon },
  { value: "system", label: "Auto (system)", Icon: Monitor },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<ThemeMode | null>(null);
  const reduced = useReducedMotion() ?? false;

  const highlighted = expanded && hoveredMode ? hoveredMode : mode;
  const highlightedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === highlighted)
  );
  const overlayX = expanded ? highlightedIndex * 44 : 0;

  function collapse() {
    setExpanded(false);
    setHoveredMode(null);
  }

  return (
    <div
      className="group relative flex h-11 w-11 rounded-lg border border-[var(--gp-border)] overflow-hidden bg-[var(--gp-surface)] transition-[width] duration-200 ease-[var(--gp-ease-out)] hover:w-[8.25rem] focus-within:w-[8.25rem]"
      role="group"
      aria-label="Theme"
      aria-expanded={expanded}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={collapse}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          collapse();
        }
      }}
    >
      <motion.span
        aria-hidden
        className="absolute top-0 left-0 z-0 h-11 w-11 bg-[var(--gp-accent)] pointer-events-none"
        animate={{ x: overlayX }}
        transition={reduced ? { duration: 0 } : tweenFast}
      />

      {options.map(({ value, label, Icon }) => {
        const active = mode === value;
        const visible = active || expanded;
        const highlightedOption = highlighted === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            onMouseEnter={() => setHoveredMode(value)}
            onFocus={() => setHoveredMode(value)}
            aria-label={label}
            aria-pressed={active}
            aria-hidden={!visible}
            tabIndex={visible ? 0 : -1}
            title={label}
            className={`relative z-10 inline-flex h-11 shrink-0 items-center justify-center transition-all duration-200 ease-[var(--gp-ease-out)] ${
              active
                ? "w-11 opacity-100"
                : "w-0 opacity-0 overflow-hidden pointer-events-none group-hover:w-11 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:w-11 group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
            } ${
              highlightedOption
                ? "text-[var(--gp-accent-fg)]"
                : "gp-text-muted"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
