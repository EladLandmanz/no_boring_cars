import Link from "next/link";
import { signOut } from "@/actions/auth";
import { getAuthContext } from "@/lib/auth/session";
import { countUnreadNotifications } from "@/lib/notifications";

export async function Header() {
  const { user, profile } = await getAuthContext();
  const unread = user ? await countUnreadNotifications() : 0;

  return (
    <header className="flex items-center justify-between gap-4 border-b-2 border-zinc-900 bg-white px-6 py-3 dark:border-zinc-100 dark:bg-zinc-950">
      <Link
        href="/"
        className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
      >
        No Boring Cars
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/auctions" className="hover:underline">
          Auctions
        </Link>
        {user ? (
          <>
            <Link href="/account#alerts" className="hover:underline">
              {unread > 0 ? `Alerts (${unread})` : "Alerts"}
            </Link>
            <Link href="/account#watchlist" className="hover:underline">
              Watchlist
            </Link>
            <Link
              href="/sell"
              className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Sell
            </Link>
            <Link href="/account" className="hover:underline">
              {profile?.has_chosen_username
                ? `@${profile.username}`
                : "Complete profile"}
            </Link>
            {profile?.role === "admin" ? (
              <Link href="/admin" className="hover:underline">
                Admin
              </Link>
            ) : null}
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
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
