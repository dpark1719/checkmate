import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ blockedId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { blockedId } = await params;
  const supabase = await createClient();

  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  return jsonOk({ blocked: false });
}
