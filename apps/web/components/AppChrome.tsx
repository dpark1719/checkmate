"use client";

import { AppBottomNav } from "@/components/AppBottomNav";
import { AppNav } from "@/components/AppNav";
import { MotionPage } from "@/components/motion/MotionPage";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const NO_CHROME_PREFIXES = ["/login", "/signup", "/auth/"];

function shouldShowChrome(pathname: string) {
  if (pathname === "/") return false;
  if (NO_CHROME_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return true;
}

function isConversationDetail(pathname: string) {
  return /^\/messages\/[^/]+$/.test(pathname);
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!shouldShowChrome(pathname)) {
    return <>{children}</>;
  }

  const conversationDetail = isConversationDetail(pathname);

  return (
    <>
      {!conversationDetail && <AppNav />}
      <main
        className={`max-w-3xl mx-auto px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] ${
          conversationDetail ? "pt-0" : "pt-6"
        }`}
      >
        <AnimatePresence mode="wait">
          <MotionPage key={pathname}>{children}</MotionPage>
        </AnimatePresence>
      </main>
      <AppBottomNav />
    </>
  );
}
