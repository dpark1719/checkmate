"use client";

import { useTheme } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";
import { Monitor, Moon, Sun } from "lucide-react";

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

  return (
    <div
      className="flex rounded-lg border border-[var(--gp-border)] overflow-hidden bg-[var(--gp-surface)]"
      role="group"
      aria-label="Theme"
    >
      {options.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${
              active
                ? "text-[var(--gp-accent-fg)]"
                : "gp-text-muted hover:text-[var(--gp-fg)]"
            }`}
            style={
              active ? { backgroundColor: "var(--gp-accent)" } : undefined
            }
          >
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
