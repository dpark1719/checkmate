import { getAdminClient } from "./supabase";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "GoalPost <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email] RESEND_API_KEY not set — would send:", payload.subject, "→", payload.to);
    }
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] Resend error:", err);
    return false;
  }
  return true;
}

export function emailEnabled(
  prefs: Record<string, unknown> | null | undefined,
  key: "emailComments" | "emailMessages"
): boolean {
  if (!prefs || prefs[key] === undefined) return true;
  return Boolean(prefs[key]);
}

export async function sendCommentEmail(options: {
  toUserId: string;
  actorName: string;
  postId: string;
  commentPreview: string;
  prefs?: Record<string, unknown> | null;
}): Promise<void> {
  if (!emailEnabled(options.prefs, "emailComments")) return;

  const email = await getUserEmail(options.toUserId);
  if (!email) return;

  const link = `${getAppUrl()}/feed`;
  const preview =
    options.commentPreview.length > 120
      ? `${options.commentPreview.slice(0, 117)}…`
      : options.commentPreview;

  await sendEmail({
    to: email,
    subject: `${options.actorName} commented on your GoalPost`,
    text: `${options.actorName} commented: "${preview}"\n\nView your feed: ${link}`,
    html: `<p><strong>${escapeHtml(options.actorName)}</strong> commented on your post:</p><p>${escapeHtml(preview)}</p><p><a href="${link}">Open GoalPost</a></p>`,
  });
}

export async function sendMessageEmail(options: {
  toUserId: string;
  actorName: string;
  conversationId: string;
  messagePreview: string;
  prefs?: Record<string, unknown> | null;
}): Promise<void> {
  if (!emailEnabled(options.prefs, "emailMessages")) return;

  const email = await getUserEmail(options.toUserId);
  if (!email) return;

  const link = `${getAppUrl()}/messages/${options.conversationId}`;
  const preview =
    options.messagePreview.length > 120
      ? `${options.messagePreview.slice(0, 117)}…`
      : options.messagePreview;

  await sendEmail({
    to: email,
    subject: `New message from ${options.actorName} on GoalPost`,
    text: `${options.actorName}: "${preview}"\n\nReply: ${link}`,
    html: `<p><strong>${escapeHtml(options.actorName)}</strong> sent you a message:</p><p>${escapeHtml(preview)}</p><p><a href="${link}">Open conversation</a></p>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
