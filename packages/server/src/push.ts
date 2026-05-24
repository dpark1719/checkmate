import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "./supabase";

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  sound?: string;
  data?: Record<string, string>;
}

export async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (tokens.length === 0) return;

  const messages: ExpoMessage[] = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: "default",
  }));

  const chunks: ExpoMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chunk),
    });
  }
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  supabase: SupabaseClient = getAdminClient()
): Promise<number> {
  const { data: rows } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);

  const tokens = (rows ?? []).map((r) => r.token);
  await sendExpoPush(tokens, title, body, data);
  return tokens.length;
}
