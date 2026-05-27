"use client";

import { NavBadge } from "@/components/NavBadge";
import { formatBadgeCount, useUnreadCounts } from "@/hooks/useUnreadCounts";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/feed", label: "Home", icon: "⌂", badge: "comments" as const },
  { href: "/post", label: "Post", icon: "＋" },
  { href: "/discover", label: "Discover", icon: "◇" },
  { href: "/messages", label: "Messages", icon: "✉", badge: "messages" as const },
  { href: "/goals", label: "Goals", icon: "◎" },
  { href: "/profile", label: "Profile", icon: "☺" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/feed") return pathname === "/feed";
  if (href === "/messages") {
    return pathname === "/messages" || pathname.startsWith("/messages/");
  }
  if (href === "/profile") {
    return pathname === "/profile" || pathname.startsWith("/settings");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppBottomNav() {
  const pathname = usePathname();
  const { counts } = useUnreadCounts();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--gp-border)] bg-[var(--gp-nav-bg)] backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      <div className="max-w-3xl mx-auto flex items-stretch justify-around h-14">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          const badgeKey = "badge" in tab ? tab.badge : undefined;
          const badgeCount =
            badgeKey === "messages"
              ? counts.messages
              : badgeKey === "comments"
                ? counts.comments
                : 0;
          const badgeLabel = formatBadgeCount(badgeCount);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                active
                  ? "text-emerald-500"
                  : "text-[var(--gp-muted)] hover:text-[var(--gp-fg)]"
              }`}
            >
              <span className="relative text-lg leading-none" aria-hidden>
                {tab.icon}
                {badgeLabel && <NavBadge count={badgeCount} />}
              </span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
