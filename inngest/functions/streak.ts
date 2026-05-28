import { reconcileAllStreaks, reconcileStreaksForUser } from "@checkmate/server";
import { inngest } from "../client";

export const calculateStreaks = inngest.createFunction(
  { id: "checkmate-streak-calculate", name: "checkmate/streak.calculate" },
  { event: "checkmate/streak.calculate" },
  async ({ event, step }) => {
    const { userId, timezone } = event.data as {
      userId: string;
      timezone?: string;
    };

    await step.run("reconcile-streaks", async () => {
      if (userId && timezone) {
        await reconcileStreaksForUser(userId, timezone);
        return { userId };
      }
      const count = await reconcileAllStreaks();
      return { users: count };
    });
  }
);

export const calculateAllStreaksCron = inngest.createFunction(
  { id: "checkmate-streak-calculate-cron", name: "checkmate/streak.calculate.all" },
  { cron: "5 0 * * *" },
  async ({ step }) => {
    await step.run("reconcile-all", async () => {
      return { users: await reconcileAllStreaks() };
    });
  }
);
