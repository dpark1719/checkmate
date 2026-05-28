import {
  applyHardDeadlines,
  ensureDailyChallengesForUser,
  fireDueTriggers,
  getAdminClient,
} from "@checkmate/server";
import { inngest } from "../client";

export const createDailyChallenges = inngest.createFunction(
  { id: "checkmate-daily-challenges-create", name: "checkmate/daily-challenges.create" },
  { event: "checkmate/daily-challenges.create" },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string; date: string };

    return step.run("create-challenge-rows", async () => {
      const supabase = getAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", userId)
        .single();

      if (!profile) return { userId, created: 0 };

      const created = await ensureDailyChallengesForUser(
        userId,
        profile.timezone,
        supabase
      );
      await fireDueTriggers(userId, profile.timezone, supabase);
      await applyHardDeadlines(userId, profile.timezone, supabase);
      return { userId, created };
    });
  }
);
