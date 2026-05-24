import { signPhotoUrl } from "@goalpost/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
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

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ success: true });
}
