"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "edit", label: "Edit profile" },
  { id: "settings", label: "Settings" },
] as const;

export type ProfileTabId = (typeof tabs)[number]["id"];

export function ProfileTabs({ active }: { active: ProfileTabId }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div
      className="flex gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 mb-6"
      role="tablist"
    >
      {tabs.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab.id);
        const href = `${pathname}?${params.toString()}`;
        const isActive = active === tab.id;

        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={`flex-1 text-center rounded-lg py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-800 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
