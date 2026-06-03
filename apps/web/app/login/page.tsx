import { AuthForm } from "@/components/auth/AuthForm";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const { error, reason } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {error === "auth" && (
        <p className="mb-4 max-w-md text-center text-sm text-red-400">
          Sign-in could not be completed.
          {reason ? (
            <>
              {" "}
              <span className="block mt-2 gp-text-muted text-xs">{reason}</span>
            </>
          ) : (
            <>
              {" "}
              Check that Supabase redirect URLs include your site (
              {process.env.NEXT_PUBLIC_APP_URL ?? "your Vercel URL"})
              /auth/callback and that Google and Apple OAuth are enabled in
              Supabase → Authentication → Providers.
            </>
          )}
        </p>
      )}
      <AuthForm mode="login" />
      <p className="mt-8 text-sm gp-text-muted">
        New here?{" "}
        <Link href="/signup" className="gp-btn-text">
          Sign up
        </Link>
      </p>
    </div>
  );
}
