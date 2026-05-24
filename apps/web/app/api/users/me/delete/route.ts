import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) return jsonError(error.message, "DELETE_ERROR", 500);

  const supabase = await createClient();
  await supabase.auth.signOut();

  return jsonOk({ deleted: true });
}
