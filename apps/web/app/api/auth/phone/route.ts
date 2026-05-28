import { phoneOtpSchema, verifyOtpSchema } from "@checkmate/shared";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = await createClient();

  if (body.token) {
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
    }

    const { error } = await supabase.auth.verifyOtp({
      phone: parsed.data.phone,
      token: parsed.data.token,
      type: "sms",
    });

    if (error) return jsonError(error.message, "AUTH_ERROR", 400);
    return jsonOk({ verified: true });
  }

  const parsed = phoneOtpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "VALIDATION_ERROR", 400);
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed.data.phone,
  });

  if (error) return jsonError(error.message, "AUTH_ERROR", 400);
  return jsonOk({ sent: true });
}
