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
              <span className="block mt-2 text-zinc-500 text-xs">{reason}</span>
            </>
          ) : (
            <>
              {" "}
              Check that Supabase redirect URLs include your site (
              {process.env.NEXT_PUBLIC_APP_URL ?? "your Vercel URL"})
              /auth/callback and that Google OAuth is enabled.
            </>
          )}
        </p>
      )}
      <AuthForm mode="login" />
      <p className="mt-8 text-sm text-zinc-500">
        New here?{" "}
        <Link href="/signup" className="text-emerald-400 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
