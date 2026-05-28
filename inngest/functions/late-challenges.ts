import { markExpiredChallengesAsLate } from "@checkmate/server";
import { inngest } from "../client";

export const markLateChallenges = inngest.createFunction(
  { id: "checkmate-late-mark", name: "checkmate/challenges.mark-late" },
  { cron: "*/15 * * * *" },
  async ({ step }) => {
    return step.run("mark-late", async () => ({
      marked: await markExpiredChallengesAsLate(),
    }));
  }
);
