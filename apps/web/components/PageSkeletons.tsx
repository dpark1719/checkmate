import { Skeleton } from "@/components/motion/Skeleton";

export function ProfileOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--gp-border)] p-4 space-y-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export function DiscoverCategorySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--gp-border)] p-4 space-y-3"
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--gp-border)] px-3 py-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full max-w-xs" />
      </div>
    </div>
  );
}

export function MessagesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <ConversationRowSkeleton key={i} />
      ))}
    </div>
  );
}
