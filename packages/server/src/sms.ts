import { getAppUrl } from "./email";
import { getAdminClient } from "./supabase";

export async function getUserPhone(userId: string): Promise<string | null> {
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.phone) return null;
  return data.user.phone;
}

export function smsEnabled(
  prefs: Record<string, unknown> | null | undefined,
  key: "smsDailyTrigger"
): boolean {
  if (!prefs || prefs[key] === undefined) return true;
  return Boolean(prefs[key]);
}

export async function sendTriggerSms(options: {
  toPhone: string;
  goalTitle: string;
}): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[sms] Twilio not configured — would send daily trigger to",
        options.toPhone
      );
    }
    return false;
  }

  const appUrl = getAppUrl();
  const body = `CheckMate: Time to check in on "${options.goalTitle}". ${appUrl}/post`;

  const params = new URLSearchParams();
  params.set("To", options.toPhone);
  params.set("Body", body);
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else if (fromNumber) {
    params.set("From", fromNumber);
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[sms] Twilio error:", err);
    return false;
  }

  return true;
}
