import { AppBottomNav } from "@/components/AppBottomNav";
import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <AppBottomNav />
    </>
  );
}
