import {
  markExpiredChallengesAsLate,
  refreshLeaderboards,
  resetWeeklyLeaderboards,
} from "@goalpost/server";
import { inngest } from "../client";

export const refreshLeaderboardsJob = inngest.createFunction(
  { id: "goalpost-leaderboard-refresh", name: "goalpost/leaderboard.refresh" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    return step.run("recalculate-leaderboards", async () => {
      await markExpiredChallengesAsLate();
      return refreshLeaderboards();
    });
  }
);

export const weeklyLeaderboardReset = inngest.createFunction(
  { id: "goalpost-leaderboard-weekly-reset", name: "goalpost/leaderboard.weekly-reset" },
  { cron: "0 0 * * 1" },
  async ({ step }) => {
    return step.run("reset-weekly-scores", async () => {
      await resetWeeklyLeaderboards();
      return refreshLeaderboards();
    });
  }
);
