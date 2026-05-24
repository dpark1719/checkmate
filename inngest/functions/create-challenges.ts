import {
  applyHardDeadlines,
  ensureDailyChallengesForUser,
  fireDueTriggers,
  getAdminClient,
} from "@goalpost/server";
import { inngest } from "../client";

export const createDailyChallenges = inngest.createFunction(
  { id: "goalpost-daily-challenges-create", name: "goalpost/daily-challenges.create" },
  { event: "goalpost/daily-challenges.create" },
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
