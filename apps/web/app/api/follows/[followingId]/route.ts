import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ followingId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { followingId } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ success: true });
}
