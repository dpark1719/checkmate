import { REACTION_TYPES, reactionSchema } from "@checkmate/shared";
import { resolveAvatarUrl } from "@checkmate/server";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, toCamelCase } from "@/lib/api/response";
import { dbTypesForReaction } from "@/lib/reactions";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const reactionTypeQuery = z.enum(REACTION_TYPES);

const PROFILE_SELECT =
  "user_id, created_at, profiles!reactions_user_id_fkey(id, display_name, username, avatar_url)";

type ProfileRow = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
};

function mapReactor(
  row: Record<string, unknown>,
  avatarUrl: string | null
) {
  const prof = row.profiles as ProfileRow | ProfileRow[] | null;
  const p = Array.isArray(prof) ? prof[0] : prof;
  return {
    id: (p?.id ?? row.user_id) as string,
    displayName: p?.display_name ?? "Someone",
    username: p?.username ?? "user",
    avatarUrl,
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id: postId } = await params;
  const typeParam = new URL(request.url).searchParams.get("type");
  const parsed = reactionTypeQuery.safeParse(typeParam);
  if (!parsed.success) {
    return jsonError("Invalid or missing type", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const types = dbTypesForReaction(parsed.data);

  const { data, error } = await supabase
    .from("reactions")
    .select(PROFILE_SELECT)
    .eq("post_id", postId)
    .in("type", types)
    .order("created_at", { ascending: true });

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  const reactors = await Promise.all(
    (data ?? []).map(async (row) => {
      const prof = row.profiles as ProfileRow | ProfileRow[] | null;
      const p = Array.isArray(prof) ? prof[0] : prof;
      const avatarUrl = await resolveAvatarUrl(
        supabase,
        p?.avatar_url ?? null
      );
      return mapReactor(row as Record<string, unknown>, avatarUrl);
    })
  );

  return jsonOk({ reactors });
}

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
  const typeParam = searchParams.get("type");
  const parsed = reactionTypeQuery.safeParse(typeParam);
  if (!parsed.success) {
    return jsonError("Missing or invalid type", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();
  const types = dbTypesForReaction(parsed.data);

  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .in("type", types);

  if (error) return jsonError(error.message, "DB_ERROR", 500);
  return jsonOk({ success: true });
}
