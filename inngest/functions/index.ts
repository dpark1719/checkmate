import { scheduleDailyTriggers, sendUserTrigger } from "./daily-trigger";
import { createDailyChallenges } from "./create-challenges";
import { calculateAllStreaksCron, calculateStreaks } from "./streak";
import { markLateChallenges } from "./late-challenges";
import { refreshLeaderboardsJob, weeklyLeaderboardReset } from "./leaderboard";

export const functions = [
  scheduleDailyTriggers,
  sendUserTrigger,
  createDailyChallenges,
  calculateStreaks,
  calculateAllStreaksCron,
  refreshLeaderboardsJob,
  weeklyLeaderboardReset,
  markLateChallenges,
];
