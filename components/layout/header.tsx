import Link from "next/link";
import { signOut } from "@/actions/auth";
import { getAuthContext } from "@/lib/auth/session";

export async function Header() {
  const { user, profile } = await getAuthContext();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        No Boring Cars
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/account" className="hover:underline">
              {profile?.has_chosen_username
                ? `@${profile.username}`
                : "Complete profile"}
            </Link>
            <form action={signOut}>
              <button type="submit" className="hover:underline">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">
              Log in
            </Link>
            <Link href="/signup" className="hover:underline">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
