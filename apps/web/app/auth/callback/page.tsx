import { Suspense } from "react";
import { AuthCallbackClient } from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-zinc-400">
          Completing sign in…
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
