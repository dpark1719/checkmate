"use client";

import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      void import("posthog-js").then(({ default: posthog }) => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host:
            process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
          person_profiles: "identified_only",
        });
      });
    }
  }, []);

  return <>{children}</>;
}
