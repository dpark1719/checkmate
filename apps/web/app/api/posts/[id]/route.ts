import { signPhotoUrl } from "@goalpost/server";
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
      "*, profiles(display_name, username, avatar_url), goals(title, category)"
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
    .select("id, daily_challenge_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existing) {
    return jsonError("Post not found", "NOT_FOUND", 404);
  }

  // Soft-delete via service role: RLS blocks UPDATE when deleted_at is set unless
  // posts_select allows owners to see deleted rows (see apply_posts_soft_delete_rls.sql).
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError(
      "Server misconfigured for post delete",
      "SERVER_CONFIG",
      500
    );
  }

  const deletedAt = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("posts")
    .update({ deleted_at: deletedAt })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  if (!updated) return jsonError("Post not found", "NOT_FOUND", 404);

  if (existing.daily_challenge_id) {
    const { error: challengeError } = await admin
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
