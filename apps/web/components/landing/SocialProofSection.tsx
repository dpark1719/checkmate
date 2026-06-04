"use client";

import { ActivityFeed } from "@/components/landing/ActivityFeed";
import { StatsBar } from "@/components/landing/StatsBar";
import type { MockPost, MockStats } from "@/lib/landing/mockData";
import { useInView } from "@/lib/use-in-view";

interface SocialProofSectionProps {
  stats: MockStats;
  posts: MockPost[];
  fill?: boolean;
}

export function SocialProofSection({
  stats,
  posts,
  fill,
}: SocialProofSectionProps) {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className={`px-4 sm:px-6 max-w-5xl mx-auto w-full ${
        fill
          ? "flex flex-col flex-1 min-h-0 gap-2 sm:gap-3"
          : "space-y-3 sm:space-y-4"
      }`}
    >
      <div className="text-center space-y-1 max-w-2xl mx-auto shrink-0">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">
          People are already locked in.
        </h2>
        <p className="gp-text-muted text-xs sm:text-sm">
          Every day, thousands of people show up for their goals on CheckMate.
        </p>
      </div>

      <div className="shrink-0">
        <StatsBar
          lockedInToday={stats.lockedInToday}
          activeStreaks={stats.activeStreaks}
          animate={inView}
        />
      </div>

      <ActivityFeed posts={posts} visible={inView} fill={fill} />
    </section>
  );
}
