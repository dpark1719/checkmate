"use client";

import { ActivityFeed } from "@/components/landing/ActivityFeed";
import { LeaderboardTeaser } from "@/components/landing/LeaderboardTeaser";
import { StatsBar } from "@/components/landing/StatsBar";
import type {
  CategoryCycleItem,
  MockLeaderboardEntry,
  MockPost,
  MockStats,
} from "@/lib/landing/mockData";
import { useInView } from "@/lib/use-in-view";

interface SocialProofSectionProps {
  stats: MockStats;
  categories: CategoryCycleItem[];
  posts: MockPost[];
  leaderboard: MockLeaderboardEntry[];
}

export function SocialProofSection({
  stats,
  categories,
  posts,
  leaderboard,
}: SocialProofSectionProps) {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      className="px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-3 sm:space-y-4"
    >
      <div className="text-center space-y-1 max-w-2xl mx-auto">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">
          People are already locked in.
        </h2>
        <p className="gp-text-muted text-xs sm:text-sm">
          Every day, thousands of people show up for their goals on CheckMate.
        </p>
      </div>

      <StatsBar
        lockedInToday={stats.lockedInToday}
        activeStreaks={stats.activeStreaks}
        goalCategoriesActive={stats.goalCategoriesActive}
        categories={categories}
        animate={inView}
      />

      <ActivityFeed posts={posts} visible={inView} compact />

      <LeaderboardTeaser entries={leaderboard} compact />
    </section>
  );
}
