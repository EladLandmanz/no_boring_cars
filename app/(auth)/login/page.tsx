import Link from "next/link";
import { signIn } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNextPath } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next, "/account");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
      {params.error ? (
        <p className="text-sm text-red-600" role="alert">
          Could not complete sign-in. Try again.
        </p>
      ) : null}
      <AuthForm action={signIn} submitLabel="Log in" next={next} />
      <p className="text-sm text-zinc-500">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
