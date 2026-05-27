import { createClient } from "@supabase/supabase-js";
import { jsonError, jsonOk } from "@/lib/api/response";

/** Public check: is messaging migration applied? */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return jsonError("Supabase not configured", "CONFIG", 500);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: tables, error: tableErr } = await admin
    .from("conversations")
    .select("id")
    .limit(1);

  if (tableErr) {
    return jsonOk({
      ready: false,
      reason: tableErr.message,
      hint: "Run supabase/runbooks/apply_messaging.sql in the Supabase SQL Editor.",
    });
  }

  const { error: rpcErr } = await admin.rpc("create_dm_conversation", {
    other_user_id: "00000000-0000-0000-0000-000000000000",
    p_post_id: null,
  });

  // RPC exists if error is auth-related, not "function does not exist"
  const rpcMissing =
    rpcErr?.message?.includes("does not exist") ||
    rpcErr?.message?.includes("Could not find the function");

  if (rpcMissing) {
    return jsonOk({
      ready: false,
      reason: rpcErr?.message,
      hint: "Run supabase/runbooks/apply_messaging.sql in the Supabase SQL Editor.",
      sqlEditorUrl:
        "https://supabase.com/dashboard/project/nfpeasuabkwobyvocecc/sql/new",
    });
  }

  return jsonOk({
    ready: true,
    conversationsTable: true,
    createDmConversationRpc: true,
    note: "Migration applied. RPC test returned (expected auth error when unauthenticated).",
    sampleRpcError: rpcErr?.message ?? null,
    sampleRowCount: tables?.length ?? 0,
  });
}
