"use client";

import { AppBottomNav } from "@/components/AppBottomNav";
import { AppNav } from "@/components/AppNav";
import { usePathname } from "next/navigation";

const NO_CHROME_PREFIXES = ["/login", "/signup", "/auth/"];

function shouldShowChrome(pathname: string) {
  if (pathname === "/") return false;
  if (NO_CHROME_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return true;
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!shouldShowChrome(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <AppBottomNav />
    </>
  );
}
