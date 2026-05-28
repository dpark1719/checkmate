import { goalCategorySchema } from "@checkmate/shared";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ category: string }> };

/** Helps debug why a post may not appear in a community feed. */
export async function GET(_request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { category } = await params;
  const parsed = goalCategorySchema.safeParse(category);
  if (!parsed.success) {
    return jsonError("Invalid category", "VALIDATION_ERROR", 400);
  }

  const supabase = createAdminClient();

  const { data: community } = await supabase
    .from("goal_communities")
    .select("id")
    .eq("category", parsed.data)
    .single();

  if (!community) {
    return jsonOk({ joined: false, reason: "community_not_found" });
  }

  const { data: membership } = await supabase
    .from("community_memberships")
    .select("shared_goal_id, joined_at")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: sharedGoal } = membership?.shared_goal_id
    ? await supabase
        .from("goals")
        .select("id, title, category, is_active, archived_at")
        .eq("id", membership.shared_goal_id)
        .single()
    : { data: null };

  const { data: myPosts } = await supabase
    .from("posts")
    .select("id, goal_id, created_at, goals!inner(title, category)")
    .eq("user_id", user.id)
    .eq("goals.category", parsed.data)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const postsInFeed = (myPosts ?? []).map((p) => {
    const goal = Array.isArray(p.goals) ? p.goals[0] : p.goals;
    return {
      postId: p.id,
      goalId: p.goal_id,
      goalTitle: (goal as { title: string })?.title,
      createdAt: p.created_at,
    };
  });

  return jsonOk({
    joined: Boolean(membership),
    sharedGoal: sharedGoal
      ? {
          id: sharedGoal.id,
          title: sharedGoal.title,
          category: sharedGoal.category,
          isActive: sharedGoal.is_active,
        }
      : null,
    yourPostsInThisCommunity: postsInFeed,
    willShowInFeed: postsInFeed.length > 0 && Boolean(membership),
    hint:
      !membership
        ? "Join this community on Discover."
        : postsInFeed.length === 0
          ? `Post a photo for a ${parsed.data} goal (Post tab).`
          : sharedGoal && sharedGoal.category !== parsed.data
            ? "Shared goal category does not match this community."
            : "Your posts should appear in the community feed.",
  });
}
