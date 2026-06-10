import { AuthForm } from "@/components/auth/AuthForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const { error, reason } = await searchParams;

  const authError =
    error === "auth" ? (
      <>
        Sign-in could not be completed.
        {reason ? (
          <span className="block mt-2 gp-text-muted text-xs">{reason}</span>
        ) : (
          <span className="block mt-2 gp-text-muted text-xs">
            For local dev, Supabase redirect URLs must include{" "}
            <code className="text-xs">http://localhost:3004/auth/callback</code>{" "}
            (and production <code className="text-xs">/auth/callback</code> on
            Vercel). Google OAuth must be enabled in Supabase → Authentication
            → Providers.
          </span>
        )}
      </>
    ) : undefined;

  return (
    <AuthPageShell
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="gp-btn-text">
            Sign up
          </Link>
        </>
      }
    >
      <AuthForm mode="login" authError={authError} />
    </AuthPageShell>
  );
}
