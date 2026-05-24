import { reactionSchema } from "@goalpost/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id: postId } = await params;
  const body = await request.json();
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .upsert(
      {
        post_id: postId,
        user_id: user.id,
        type: parsed.data.type,
      },
      { onConflict: "post_id,user_id,type" }
    )
    .select()
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ reaction: toCamelCase(data) }, 201);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id: postId } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  if (!type) return jsonError("Missing type", "VALIDATION_ERROR", 400);

  const supabase = await createClient();
  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("type", type);

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ success: true });
}
