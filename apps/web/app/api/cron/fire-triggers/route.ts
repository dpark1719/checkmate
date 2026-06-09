import { ensureAllUsersDailyChallenges } from "@checkmate/server";
import { jsonError, jsonOk } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return jsonError("CRON_SECRET not configured", "CRON_NOT_CONFIGURED", 503);
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", "UNAUTHORIZED", 401);
  }

  const result = await ensureAllUsersDailyChallenges();
  return jsonOk({ success: true, ...result });
}
