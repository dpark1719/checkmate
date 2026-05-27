import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "post-photos";
const AVATAR_BUCKET = "avatars";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

async function signStorageUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Failed to sign storage URL");
  }
  return data.signedUrl;
}

export async function signPhotoUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string> {
  return signStorageUrl(supabase, BUCKET, path);
}

export async function signAvatarUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string> {
  return signStorageUrl(supabase, AVATAR_BUCKET, path);
}

async function signStorageUrls(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const map = new Map<string, string>();
  await Promise.all(
    unique.map(async (path) => {
      if (path.startsWith("http")) {
        map.set(path, path);
        return;
      }
      map.set(path, await signStorageUrl(supabase, bucket, path));
    })
  );
  return map;
}

export async function signPhotoUrls(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  return signStorageUrls(supabase, BUCKET, paths);
}

export async function signAvatarUrls(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  return signStorageUrls(supabase, AVATAR_BUCKET, paths);
}

/** Resolve stored avatar_url (storage path or legacy https URL). */
export async function resolveAvatarUrl(
  supabase: SupabaseClient,
  stored: string | null | undefined
): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith("http")) return stored;
  return signAvatarUrl(supabase, stored);
}

export { BUCKET, AVATAR_BUCKET };
