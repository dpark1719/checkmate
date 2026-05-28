import { AVATAR_BUCKET, resolveAvatarUrl } from "@checkmate/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getAuthUserFromRequest,
  getSupabaseForRequest,
} from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

const MAX_BYTES = 512 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return jsonError("Missing file", "VALIDATION_ERROR", 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonError("Invalid file type", "INVALID_FILE_TYPE", 400);
  }

  if (file.size > MAX_BYTES) {
    return jsonError("File too large (max 512KB)", "FILE_TOO_LARGE", 400);
  }

  const path = `${user.id}/avatar.jpg`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = await getSupabaseForRequest(request);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType: "image/jpeg", upsert: true });

  if (uploadError) {
    return jsonError(uploadError.message, "UPLOAD_ERROR", 500);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", user.id);

  if (profileError) {
    return jsonError(profileError.message, "DB_ERROR", 500);
  }

  const avatarUrl = await resolveAvatarUrl(supabase, path);
  return jsonOk({ path, avatarUrl }, 201);
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await getSupabaseForRequest(request);
  const path = `${user.id}/avatar.jpg`;

  await supabase.storage.from(AVATAR_BUCKET).remove([path]);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  return jsonOk({ removed: true });
}
