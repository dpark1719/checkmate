import {
  markExpiredChallengesAsLate,
  refreshLeaderboards,
  resetWeeklyLeaderboards,
} from "@checkmate/server";
import { inngest } from "../client";

export const refreshLeaderboardsJob = inngest.createFunction(
  { id: "checkmate-leaderboard-refresh", name: "checkmate/leaderboard.refresh" },
  { cron: "0 * * * *" },
  async ({ step }) => {
    return step.run("recalculate-leaderboards", async () => {
      await markExpiredChallengesAsLate();
      return refreshLeaderboards();
    });
  }
);

export const weeklyLeaderboardReset = inngest.createFunction(
  { id: "checkmate-leaderboard-weekly-reset", name: "checkmate/leaderboard.weekly-reset" },
  { cron: "0 0 * * 1" },
  async ({ step }) => {
    return step.run("reset-weekly-scores", async () => {
      await resetWeeklyLeaderboards();
      return refreshLeaderboards();
    });
  }
);
