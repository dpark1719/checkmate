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
      className="py-16 sm:py-24 px-6 max-w-5xl mx-auto w-full space-y-12"
    >
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          People are already locked in.
        </h2>
        <p className="gp-text-muted text-base sm:text-lg">
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

      <ActivityFeed posts={posts} visible={inView} />

      <LeaderboardTeaser entries={leaderboard} />
    </section>
  );
}
