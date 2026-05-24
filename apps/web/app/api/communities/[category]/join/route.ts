import { goalCategorySchema } from "@goalpost/shared";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ category: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { category } = await params;
  const parsed = goalCategorySchema.safeParse(category);
  if (!parsed.success) {
    return jsonError("Invalid category", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data: community, error: communityError } = await supabase
    .from("goal_communities")
    .select("id")
    .eq("category", parsed.data)
    .single();

  if (communityError || !community) {
    return jsonError("Community not found", "NOT_FOUND", 404);
  }

  const { error } = await supabase.from("community_memberships").upsert(
    {
      user_id: user.id,
      community_id: community.id,
    },
    { onConflict: "user_id,community_id" }
  );

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const { count } = await supabase
    .from("community_memberships")
    .select("*", { count: "exact", head: true })
    .eq("community_id", community.id);

  await supabase
    .from("goal_communities")
    .update({ member_count: count ?? 0 })
    .eq("id", community.id);

  return jsonOk({ joined: true, category: parsed.data }, 201);
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
