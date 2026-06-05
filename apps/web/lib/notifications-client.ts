/** Tell nav badges and hooks to refetch unread counts. */
export function refreshNotificationBadges() {
  window.dispatchEvent(new Event("checkmate:notifications-changed"));
}

export async function markAllCommentsRead(): Promise<void> {
  await fetch("/api/notifications/mark-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "comments", all: true }),
  });
  refreshNotificationBadges();
}

export async function markPostCommentsRead(postId: string): Promise<void> {
  await fetch("/api/notifications/mark-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "comments", postId }),
  });
  refreshNotificationBadges();
}
