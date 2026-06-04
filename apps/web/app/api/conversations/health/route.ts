import { createClient } from "@supabase/supabase-js";
import { jsonError, jsonOk } from "@/lib/api/response";

const MIGRATION_HINT =
  "Run supabase/migrations/20250602120000_message_requests.sql (or supabase/runbooks/apply_messaging.sql) in the Supabase SQL Editor.";

const SQL_EDITOR_URL =
  "https://supabase.com/dashboard/project/nfpeasuabkwobyvocecc/sql/new";

function rpcMissing(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the function")
  );
}

function columnMissing(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("column") && lower.includes("does not exist") ||
    lower.includes("could not find") && lower.includes("column")
  );
}

/** Public check: is messaging migration applied (including message requests)? */
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
      hint: MIGRATION_HINT,
      sqlEditorUrl: SQL_EDITOR_URL,
    });
  }

  const { error: initiatedByErr } = await admin
    .from("conversations")
    .select("initiated_by")
    .limit(1);

  if (columnMissing(initiatedByErr?.message)) {
    return jsonOk({
      ready: false,
      reason: initiatedByErr?.message,
      missing: "conversations.initiated_by",
      hint: MIGRATION_HINT,
      sqlEditorUrl: SQL_EDITOR_URL,
    });
  }

  const { error: statusErr } = await admin
    .from("conversation_participants")
    .select("status")
    .limit(1);

  if (columnMissing(statusErr?.message)) {
    return jsonOk({
      ready: false,
      reason: statusErr?.message,
      missing: "conversation_participants.status",
      hint: MIGRATION_HINT,
      sqlEditorUrl: SQL_EDITOR_URL,
    });
  }

  const rpcChecks: Array<{
    name: string;
    fn: () => ReturnType<typeof admin.rpc>;
  }> = [
    {
      name: "create_dm_conversation",
      fn: () =>
        admin.rpc("create_dm_conversation", {
          other_user_id: "00000000-0000-0000-0000-000000000000",
          p_post_id: null,
        }),
    },
    {
      name: "accept_conversation_request",
      fn: () =>
        admin.rpc("accept_conversation_request", {
          cid: "00000000-0000-0000-0000-000000000000",
        }),
    },
    {
      name: "decline_conversation_request",
      fn: () =>
        admin.rpc("decline_conversation_request", {
          cid: "00000000-0000-0000-0000-000000000000",
        }),
    },
  ];

  const rpcResults: Record<
    string,
    { exists: boolean; sampleError: string | null }
  > = {};

  for (const { name, fn } of rpcChecks) {
    const { error: rpcErr } = await fn();
    if (rpcMissing(rpcErr?.message)) {
      return jsonOk({
        ready: false,
        reason: rpcErr?.message,
        missing: name,
        hint: MIGRATION_HINT,
        sqlEditorUrl: SQL_EDITOR_URL,
      });
    }
    rpcResults[name] = {
      exists: true,
      sampleError: rpcErr?.message ?? null,
    };
  }

  return jsonOk({
    ready: true,
    conversationsTable: true,
    initiatedByColumn: true,
    participantStatusColumn: true,
    createDmConversationRpc: rpcResults.create_dm_conversation?.exists ?? true,
    acceptConversationRequestRpc:
      rpcResults.accept_conversation_request?.exists ?? true,
    declineConversationRequestRpc:
      rpcResults.decline_conversation_request?.exists ?? true,
    note: "Message requests migration applied. RPC probes returned expected auth/not-found errors.",
    sampleRpcErrors: Object.fromEntries(
      Object.entries(rpcResults).map(([k, v]) => [k, v.sampleError])
    ),
    sampleRowCount: tables?.length ?? 0,
  });
}
