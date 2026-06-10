import { Skeleton } from "@/components/motion/Skeleton";

export function FeedPostSkeleton() {
  return (
    <article className="rounded-xl border border-[var(--gp-border)] overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-4 flex gap-2">
        <Skeleton className="h-10 w-14 rounded-full" />
        <Skeleton className="h-10 w-14 rounded-full" />
        <Skeleton className="h-10 w-14 rounded-full" />
      </div>
    </article>
  );
}

export function FeedPostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <FeedPostSkeleton key={i} />
      ))}
    </div>
  );
}
