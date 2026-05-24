import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "post-photos";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

export async function signPhotoUrl(
  supabase: SupabaseClient,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Failed to sign photo URL");
  }
  return data.signedUrl;
}

export async function signPhotoUrls(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    paths.map(async (path) => {
      if (!path || path.startsWith("http")) {
        map.set(path, path);
        return;
      }
      map.set(path, await signPhotoUrl(supabase, path));
    })
  );
  return map;
}

export { BUCKET };
