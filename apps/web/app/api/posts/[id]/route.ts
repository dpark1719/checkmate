import {
  canModeratePosts,
  getUserRole,
  signPhotoUrl,
  updatePost,
} from "@checkmate/server";
import { updatePostSchema } from "@checkmate/shared";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, reactions(type, user_id), profiles(display_name, username, avatar_url), goals!posts_goal_id_fkey(title, category)"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return jsonError("Not found", "NOT_FOUND", 404);

  const signed = await signPhotoUrl(supabase, data.photo_url);
  return jsonOk({ post: { ...toCamelCase(data), photoUrl: signed } });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("posts")
    .select("id, user_id, daily_challenge_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existing) {
    return jsonError("Post not found", "NOT_FOUND", 404);
  }

  const isOwner = existing.user_id === user.id;
  const role = await getUserRole(supabase, user.id);
  const isModerator = canModeratePosts(role);

  if (!isOwner && !isModerator) {
    return jsonError("Forbidden", "FORBIDDEN", 403);
  }

  const deletedAt = new Date().toISOString();

  if (isModerator && !isOwner) {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return jsonError(
        "Could not remove post (missing server config)",
        "MODERATE_POST_BLOCKED",
        500
      );
    }

    const { data: adminUpdated, error: adminError } = await admin
      .from("posts")
      .update({ deleted_at: deletedAt })
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (adminError) return jsonError(adminError.message, "DB_ERROR", 500);
    if (!adminUpdated) return jsonError("Post not found", "NOT_FOUND", 404);

    return jsonOk({ success: true, moderated: true });
  }

  const { data: updated, error: updateError } = await supabase
    .from("posts")
    .update({ deleted_at: deletedAt })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return jsonError(
        "Could not delete post (missing server config or RLS not applied)",
        "DELETE_POST_BLOCKED",
        500
      );
    }

    const { data: adminUpdated, error: adminError } = await admin
      .from("posts")
      .update({ deleted_at: deletedAt })
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (adminError) return jsonError(adminError.message, "DB_ERROR", 500);
    if (!adminUpdated) return jsonError("Post not found", "NOT_FOUND", 404);
  } else if (!updated) {
    return jsonError("Post not found", "NOT_FOUND", 404);
  }

  if (existing.daily_challenge_id) {
    const { error: challengeError } = await supabase
      .from("daily_challenges")
      .update({
        posted_at: null,
        is_late: false,
        streak_credited: false,
      })
      .eq("id", existing.daily_challenge_id)
      .eq("user_id", user.id);

    if (challengeError) {
      return jsonError(
        challengeError.message,
        "CHALLENGE_UPDATE_ERROR",
        500
      );
    }
  }

  return jsonOk({ success: true });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const result = await updatePost(supabase, user.id, id, parsed.data);

  if ("error" in result) {
    if (result.error === "NOT_FOUND") {
      return jsonError("Post not found", "NOT_FOUND", 404);
    }
    if (result.error === "VALIDATION_ERROR") {
      return jsonError("No changes provided", "VALIDATION_ERROR", 400);
    }
    return jsonError(result.message ?? "Update failed", "DB_ERROR", 500);
  }

  return jsonOk({ post: result.post });
}
