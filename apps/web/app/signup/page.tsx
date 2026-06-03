import { AuthForm } from "@/components/auth/AuthForm";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <AuthForm mode="signup" />
      <p className="mt-8 text-sm gp-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="gp-btn-text">
          Log in
        </Link>
      </p>
    </div>
  );
}
