import { commentSchema } from "@checkmate/shared";
import { notifyPostComment } from "@checkmate/server";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient, getAuthUser } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

type ProfileRow = { display_name: string; username: string };

const PROFILE_SELECT =
  "profiles!comments_user_id_fkey(display_name, username)";

function extractAuthor(
  profiles: ProfileRow | ProfileRow[] | null | undefined
): { displayName: string; username: string } {
  const row = Array.isArray(profiles) ? profiles[0] : profiles;
  return {
    displayName: row?.display_name ?? "Someone",
    username: row?.username ?? "user",
  };
}

function mapComment(row: Record<string, unknown>) {
  const { profiles, ...rest } = row;
  const author = extractAuthor(
    profiles as ProfileRow | ProfileRow[] | null | undefined
  );
  return {
    id: rest.id as string,
    body: rest.body as string,
    createdAt: rest.created_at as string,
    userId: rest.user_id as string,
    postId: rest.post_id as string,
    author,
  };
}

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
    .select(`*, ${PROFILE_SELECT}`)
    .single();

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const comment = mapComment(data as Record<string, unknown>);

  void notifyPostComment({
    postId,
    commentId: comment.id,
    actorId: user.id,
    actorName: comment.author.displayName,
    commentBody: parsed.data.body,
  }).catch((e) => console.error("[notifyPostComment]", e));

  return jsonOk({ comment }, 201);
}

export async function GET(_request: Request, { params }: Params) {
  const { id: postId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(`*, ${PROFILE_SELECT}`)
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({
    comments: (data ?? []).map((c) =>
      mapComment(c as Record<string, unknown>)
    ),
  });
}
