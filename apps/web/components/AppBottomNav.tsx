"use client";

import { NavBadge } from "@/components/NavBadge";
import { formatBadgeCount, useUnreadCounts } from "@/hooks/useUnreadCounts";
import { markAllCommentsRead } from "@/lib/notifications-client";
import { motion, useReducedMotion } from "framer-motion";
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
  const reduced = useReducedMotion() ?? false;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--gp-border)] bg-[var(--gp-nav-bg)] backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
      aria-label="Main"
    >
      <div className="max-w-3xl mx-auto flex items-stretch justify-around gap-0.5 px-1 h-16 relative">
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
            <motion.div
              key={tab.href}
              className="flex flex-1 min-w-0"
              whileTap={reduced ? undefined : { scale: 0.92 }}
              transition={{ duration: 0.12 }}
            >
              <Link
                href={tab.href}
                className="gp-nav-item relative w-full"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (tab.href === "/feed") {
                    void markAllCommentsRead().catch(() => {});
                  }
                }}
              >
                {active && !reduced && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-x-1 top-1 bottom-1 rounded-lg bg-[var(--gp-accent-subtle)] -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center justify-center">
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                  {badgeLabel && <NavBadge count={badgeCount} />}
                </span>
                <span className="text-[10px] font-medium leading-tight truncate max-w-full">
                  {tab.label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
