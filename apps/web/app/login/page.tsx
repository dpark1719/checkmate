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
            Check that Supabase redirect URLs include your site (
            {process.env.NEXT_PUBLIC_APP_URL ?? "your Vercel URL"})
            /auth/callback and that Google OAuth is enabled in Supabase →
            Authentication → Providers.
          </span>
        )}
      </>
    ) : undefined;

  return (
    <AuthPageShell
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="gp-btn-text gp-btn-text-xs">
            Sign up
          </Link>
        </>
      }
    >
      <AuthForm mode="login" authError={authError} />
    </AuthPageShell>
  );
}
