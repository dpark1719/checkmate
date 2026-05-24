import { markExpiredChallengesAsLate } from "@goalpost/server";
import { inngest } from "../client";

export const markLateChallenges = inngest.createFunction(
  { id: "goalpost-late-mark", name: "goalpost/challenges.mark-late" },
  { cron: "*/15 * * * *" },
  async ({ step }) => {
    return step.run("mark-late", async () => ({
      marked: await markExpiredChallengesAsLate(),
    }));
  }
);
