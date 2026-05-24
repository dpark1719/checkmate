import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
