import { goalCategorySchema, joinCommunitySchema } from "@checkmate/shared";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ category: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { category } = await params;
  const parsedCategory = goalCategorySchema.safeParse(category);
  if (!parsedCategory.success) {
    return jsonError("Invalid category", "VALIDATION_ERROR", 400);
  }

  const body = await request.json();
  const parsedBody = joinCommunitySchema.safeParse(body);
  if (!parsedBody.success) {
    return jsonError(parsedBody.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data: community, error: communityError } = await supabase
    .from("goal_communities")
    .select("id, category")
    .eq("category", parsedCategory.data)
    .single();

  if (communityError || !community) {
    return jsonError("Community not found", "NOT_FOUND", 404);
  }

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("id, category, user_id, title, is_active, archived_at")
    .eq("id", parsedBody.data.goalId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .single();

  if (goalError || !goal) {
    return jsonError("Goal not found", "NOT_FOUND", 404);
  }

  if (!goal.is_active) {
    return jsonError("Goal is not active", "GOAL_INACTIVE", 400);
  }

  if (goal.category !== community.category) {
    return jsonError(
      `This goal is "${goal.category}" but the community is "${community.category}". Pick a matching goal.`,
      "CATEGORY_MISMATCH",
      400
    );
  }

  const { error } = await supabase.from("community_memberships").upsert(
    {
      user_id: user.id,
      community_id: community.id,
      shared_goal_id: goal.id,
    },
    { onConflict: "user_id,community_id" }
  );

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  // member_count is updated by DB trigger (sync_community_member_count)

  return jsonOk(
    {
      joined: true,
      category: parsedCategory.data,
      sharedGoalId: goal.id,
      sharedGoalTitle: goal.title,
    },
    201
  );
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { category } = await params;
  const parsed = goalCategorySchema.safeParse(category);
  if (!parsed.success) {
    return jsonError("Invalid category", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data: community } = await supabase
    .from("goal_communities")
    .select("id")
    .eq("category", parsed.data)
    .single();

  if (!community) return jsonError("Community not found", "NOT_FOUND", 404);

  await supabase
    .from("community_memberships")
    .delete()
    .eq("user_id", user.id)
    .eq("community_id", community.id);

  return jsonOk({ joined: false });
}
