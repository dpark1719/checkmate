"use client";

import { useTheme } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";

const options: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div
      className="flex rounded-lg border border-[var(--gp-border)] overflow-hidden text-xs bg-[var(--gp-surface)]"
      role="group"
      aria-label="Theme"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setMode(opt.value)}
          className={`px-2.5 py-1 transition-colors ${
            mode === opt.value
              ? "font-medium text-[var(--gp-accent-fg)]"
              : "gp-text-muted hover:text-[var(--gp-fg)]"
          }`}
          style={
            mode === opt.value
              ? { backgroundColor: "var(--gp-accent)" }
              : undefined
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
