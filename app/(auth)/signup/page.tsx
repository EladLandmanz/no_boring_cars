import Link from "next/link";
import { signUp } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <AuthForm action={signUp} submitLabel="Sign up" />
      <p className="text-sm text-zinc-500">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
