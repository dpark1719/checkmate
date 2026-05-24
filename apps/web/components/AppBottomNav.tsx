"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/feed", label: "Home", icon: "⌂" },
  { href: "/post", label: "Post", icon: "＋" },
  { href: "/discover", label: "Discover", icon: "◇" },
  { href: "/goals", label: "Goals", icon: "◎" },
  { href: "/profile", label: "Profile", icon: "☺" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/feed") return pathname === "/feed";
  if (href === "/profile") {
    return pathname === "/profile" || pathname.startsWith("/settings");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      <div className="max-w-3xl mx-auto flex items-stretch justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {tab.icon}
              </span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
