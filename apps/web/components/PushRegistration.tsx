"use client";

import { useEffect } from "react";

export function PushRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    async function register() {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // Web push via Expo is mobile-first; store a placeholder for PWA future.
      // Mobile apps register Expo push tokens via the mobile client.
      const token = `web-${crypto.randomUUID()}`;
      await fetch("/api/push-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform: "web" }),
      });
    }

    register().catch(() => undefined);
  }, []);

  return null;
}
