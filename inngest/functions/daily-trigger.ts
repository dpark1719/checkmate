import { ensureAllUsersDailyChallenges } from "@checkmate/server";
import { inngest } from "../client";

export const scheduleDailyTriggers = inngest.createFunction(
  { id: "checkmate-daily-trigger-schedule", name: "checkmate/daily-trigger.schedule" },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    const result = await step.run("schedule-user-triggers", async () => {
      return ensureAllUsersDailyChallenges();
    });
    return result;
  }
);

export const sendUserTrigger = inngest.createFunction(
  { id: "checkmate-trigger-send", name: "checkmate/trigger.send" },
  { event: "checkmate/trigger.send" },
  async ({ event, step }) => {
    const { userId, goalId, challengeId } = event.data as {
      userId: string;
      goalId: string;
      challengeId: string;
    };

    await step.run("mark-trigger-fired", async () => {
      const { getAdminClient } = await import("@checkmate/server");
      const supabase = getAdminClient();
      const now = new Date().toISOString();

      await supabase
        .from("daily_challenges")
        .update({ trigger_fired_at: now })
        .eq("id", challengeId)
        .eq("user_id", userId)
        .eq("goal_id", goalId);

      return { userId, goalId, challengeId };
    });
  }
);
