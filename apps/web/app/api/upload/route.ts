import { BUCKET } from "@goalpost/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getAuthUserFromRequest,
  getSupabaseForRequest,
} from "@/lib/supabase/auth";
import { NextRequest } from "next/server";

const MAX_BYTES = 5 * 1024 * 1024;
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
    return jsonError("File too large (max 5MB)", "FILE_TOO_LARGE", 400);
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = await getSupabaseForRequest(request);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return jsonError(uploadError.message, "UPLOAD_ERROR", 500);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (signError || !signed?.signedUrl) {
    return jsonError(signError?.message ?? "Sign failed", "SIGN_ERROR", 500);
  }

  return jsonOk({ path, signedUrl: signed.signedUrl }, 201);
}
