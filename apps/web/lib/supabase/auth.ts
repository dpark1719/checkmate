import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, getAuthUser } from "./server";
import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export async function getAuthUserFromRequest(
  request?: NextRequest
): Promise<User | null> {
  const bearer = request?.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    const token = bearer.slice(7);
    const client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await client.auth.getUser(token);
    return data.user;
  }
  return getAuthUser();
}

export async function getSupabaseForRequest(request?: NextRequest) {
  const bearer = request?.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    const token = bearer.slice(7);
    const client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );
    return client;
  }
  return createClient();
}
