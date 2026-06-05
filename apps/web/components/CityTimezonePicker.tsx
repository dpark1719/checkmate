"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

interface CityTimezoneResult {
  id: string;
  label: string;
  city: string;
  province: string;
  country: string;
  iso2: string;
  timezone: string;
}

interface CityTimezonePickerProps {
  timezone: string;
  timezoneLabel: string | null;
  onChange: (value: { timezone: string; timezoneLabel: string }) => void;
  required?: boolean;
  /** When set, reverse-lookup this IANA timezone on mount if no label is saved. */
  prefillTimezone?: string | null;
}

export function CityTimezonePicker({
  timezone,
  timezoneLabel,
  onChange,
  required = false,
  prefillTimezone = null,
}: CityTimezonePickerProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(timezoneLabel ?? "");
  const [results, setResults] = useState<CityTimezoneResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [hasSelection, setHasSelection] = useState(
    Boolean(timezone && timezoneLabel)
  );
  const prefillAttempted = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (timezoneLabel) {
      setQuery(timezoneLabel);
      setHasSelection(Boolean(timezone));
    }
  }, [timezone, timezoneLabel]);

  useEffect(() => {
    if (prefillAttempted.current) return;
    if (timezoneLabel || !prefillTimezone) return;

    prefillAttempted.current = true;
    let cancelled = false;

    async function prefill() {
      const res = await fetch(
        `/api/timezones/search?timezone=${encodeURIComponent(prefillTimezone!)}`
      );
      const data = await res.json();
      if (cancelled || !res.ok || !data.result) return;
      const match = data.result as CityTimezoneResult;
      setQuery(match.label);
      setHasSelection(true);
      onChangeRef.current({
        timezone: match.timezone,
        timezoneLabel: match.label,
      });
    }

    void prefill();
    return () => {
      cancelled = true;
    };
  }, [prefillTimezone, timezoneLabel]);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/timezones/search?q=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setResults([]);
        return;
      }
      const next = (data.results ?? []) as CityTimezoneResult[];
      setResults(next);
      setOpen(next.length > 0);
      setHighlightIndex(next.length > 0 ? 0 : -1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasSelection && query === timezoneLabel) return;

    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, hasSelection, timezoneLabel, runSearch]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  function selectResult(result: CityTimezoneResult) {
    setQuery(result.label);
    setHasSelection(true);
    setOpen(false);
    setResults([]);
    setHighlightIndex(-1);
    onChange({ timezone: result.timezone, timezoneLabel: result.label });
  }

  function handleInputChange(value: string) {
    setQuery(value);
    setHasSelection(false);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const pick = results[highlightIndex] ?? results[0];
      if (pick) selectResult(pick);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative space-y-1">
      <label className="text-sm gp-text-muted">City</label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search your city…"
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className="w-full mt-1 gp-input"
      />

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-[var(--gp-border)] bg-[var(--gp-card)] shadow-lg py-1"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm gp-text-muted">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm gp-text-muted">No cities found</li>
          ) : (
            results.map((result, index) => (
              <li key={result.id} role="option" aria-selected={index === highlightIndex}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectResult(result)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--gp-surface)] ${
                    index === highlightIndex ? "bg-[var(--gp-surface)]" : ""
                  }`}
                >
                  {result.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {!open && query.trim().length >= 2 && !loading && results.length === 0 && !hasSelection && (
        <p className="text-xs gp-text-muted">No cities found</p>
      )}

      {hasSelection && timezone && (
        <p className="text-xs gp-text-muted">Timezone: {timezone}</p>
      )}
    </div>
  );
}
