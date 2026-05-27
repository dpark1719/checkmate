import { commentSchema } from "@goalpost/shared";
import { notifyPostComment } from "@goalpost/server";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const { id: postId } = await params;
  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      body: parsed.data.body,
    })
    .select("*, profiles(display_name, username)")
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const profile = data.profiles as
    | { display_name: string; username: string }
    | { display_name: string; username: string }[]
    | null;
  const author = Array.isArray(profile) ? profile[0] : profile;

  void notifyPostComment({
    postId,
    commentId: data.id as string,
    actorId: user.id,
    actorName: author?.display_name ?? "Someone",
    commentBody: parsed.data.body,
  }).catch((e) => console.error("[notifyPostComment]", e));

  return jsonOk({ comment: toCamelCase(data) }, 201);
}

export async function GET(_request: Request, { params }: Params) {
  const { id: postId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(display_name, username)")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ comments: (data ?? []).map((c) => toCamelCase(c)) });
}
