import {
  AVATAR_BUCKET,
  ensureAvatarsBucket,
  isAvatarsBucketMissingError,
} from "@checkmate/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthUserFromRequest,
  getSupabaseForRequest,
} from "@/lib/supabase/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const MAX_BYTES = 512 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const AVATARS_SETUP_HINT =
  "Avatars storage not configured — run supabase/migrations/20250524120000_avatars_bucket.sql in Supabase SQL Editor.";

async function signAvatarPath(supabase: SupabaseClient, path: string) {
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    return {
      error: error?.message ?? "Sign failed",
    };
  }
  return { signedUrl: data.signedUrl };
}

async function uploadAvatarBuffer(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer
) {
  return supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
}

async function updateProfileAvatar(
  supabase: SupabaseClient,
  userId: string,
  path: string
) {
  return supabase.from("profiles").update({ avatar_url: path }).eq("id", userId);
}

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

  let uploadError = (await uploadAvatarBuffer(supabase, path, buffer)).error;

  if (uploadError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      await ensureAvatarsBucket(admin);
      uploadError = (await uploadAvatarBuffer(admin, path, buffer)).error;
      if (!uploadError) {
        const { error: profileError } = await updateProfileAvatar(
          admin,
          user.id,
          path
        );
        if (profileError) {
          return jsonError(profileError.message, "DB_ERROR", 500);
        }
        const signed = await signAvatarPath(admin, path);
        if ("error" in signed) {
          return jsonError(signed.error ?? "Sign failed", "SIGN_ERROR", 500);
        }
        return jsonOk({ path, avatarUrl: signed.signedUrl }, 201);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Admin upload failed";
      return jsonError(message, "UPLOAD_ERROR", 500);
    }
  }

  if (uploadError) {
    if (isAvatarsBucketMissingError(uploadError.message)) {
      return jsonError(AVATARS_SETUP_HINT, "AVATARS_BUCKET_MISSING", 500);
    }
    return jsonError(uploadError.message, "UPLOAD_ERROR", 500);
  }

  const { error: profileError } = await updateProfileAvatar(
    supabase,
    user.id,
    path
  );

  if (profileError) {
    return jsonError(profileError.message, "DB_ERROR", 500);
  }

  const signed = await signAvatarPath(supabase, path);
  if ("error" in signed) {
    return jsonError(signed.error ?? "Sign failed", "SIGN_ERROR", 500);
  }

  return jsonOk({ path, avatarUrl: signed.signedUrl }, 201);
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUserFromRequest(request);
  if (!user) return jsonError("Unauthorized", "UNAUTHORIZED", 401);

  const supabase = await getSupabaseForRequest(request);
  const path = `${user.id}/avatar.jpg`;

  const { error: removeError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([path]);

  if (removeError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      await admin.storage.from(AVATAR_BUCKET).remove([path]);
    } catch {
      // ignore admin remove failure
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return jsonError(error.message, "DB_ERROR", 500);

  return jsonOk({ removed: true });
}
