"use client";

import { NavBadge } from "@/components/NavBadge";
import { formatBadgeCount, useUnreadCounts } from "@/hooks/useUnreadCounts";
import {
  Compass,
  Home,
  MessageCircle,
  PlusCircle,
  Target,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/feed", label: "Home", icon: Home, badge: "comments" as const },
  { href: "/post", label: "Post", icon: PlusCircle },
  { href: "/discover", label: "Discover", icon: Compass },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageCircle,
    badge: "messages" as const,
  },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/profile", label: "Profile", icon: User },
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
      className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--gp-border)] bg-[var(--gp-nav-bg)] backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
      aria-label="Main"
    >
      <div className="max-w-3xl mx-auto flex items-stretch justify-around gap-0.5 px-1 h-16">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
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
              className="gp-nav-item"
              aria-current={active ? "page" : undefined}
            >
              <span className="relative flex items-center justify-center">
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                {badgeLabel && <NavBadge count={badgeCount} />}
              </span>
              <span className="text-[10px] font-medium leading-tight truncate max-w-full">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
