import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const { data, error } = await supabase
    .from("goal_communities")
    .select("*")
    .order("category");

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  let myMemberships: {
    category: string;
    sharedGoalId: string | null;
    sharedGoalTitle: string | null;
    joinedAt: string;
  }[] = [];

  if (user) {
    const { data: memberships } = await supabase
      .from("community_memberships")
      .select("shared_goal_id, joined_at, community_id")
      .eq("user_id", user.id);

    if (memberships?.length) {
      const communityIds = memberships.map((m) => m.community_id);
      const goalIds = memberships
        .map((m) => m.shared_goal_id)
        .filter((id): id is string => Boolean(id));

      const [{ data: communities }, { data: goals }] = await Promise.all([
        supabase.from("goal_communities").select("id, category").in("id", communityIds),
        goalIds.length
          ? supabase.from("goals").select("id, title").in("id", goalIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);

      const categoryByCommunity = new Map(
        (communities ?? []).map((c) => [c.id, c.category as string])
      );
      const titleByGoal = new Map((goals ?? []).map((g) => [g.id, g.title]));

      myMemberships = memberships.map((m) => ({
        category: categoryByCommunity.get(m.community_id) ?? "",
        sharedGoalId: m.shared_goal_id,
        sharedGoalTitle: m.shared_goal_id
          ? titleByGoal.get(m.shared_goal_id) ?? null
          : null,
        joinedAt: m.joined_at,
      }));
    }
  }

  return jsonOk({
    communities: (data ?? []).map((c) => toCamelCase(c)),
    myMemberships,
  });
}
