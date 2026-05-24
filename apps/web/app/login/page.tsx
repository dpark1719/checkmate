import { AuthForm } from "@/components/auth/AuthForm";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {error === "auth" && (
        <p className="mb-4 max-w-md text-center text-sm text-red-400">
          Sign-in link expired or could not be verified. Request a new magic link
          and open it on the same computer where GoalPost is running (
          {process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}).
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
