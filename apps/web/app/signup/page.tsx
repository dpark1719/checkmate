import { AuthForm } from "@/components/auth/AuthForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import Link from "next/link";

export default function SignupPage() {
  return (
    <AuthPageShell
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="gp-btn-text gp-btn-text-xs">
            Log in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" />
    </AuthPageShell>
  );
}
