import Link from "next/link";
import { redirect } from "next/navigation";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications";
import { ListingCard } from "@/components/auctions/listing-card";
import { getAuthContext } from "@/lib/auth/session";
import { listMyListings, listWatchedListings } from "@/lib/listings/queries";
import { listMyNotifications } from "@/lib/notifications";

export default async function AccountPage() {
  const { user, profile } = await getAuthContext();
  if (!user) {
    redirect("/login?next=/account");
  }
  if (!profile?.has_chosen_username) {
    redirect("/account/username");
  }

  const mine = await listMyListings();
  const watched = await listWatchedListings();
  const alerts = await listMyNotifications();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-medium">@{profile.username}</span>
        </p>
        <p className="text-sm text-zinc-500">{user.email}</p>
        <Link href="/sell" className="mt-2 w-fit text-sm underline">
          Sell a car
        </Link>
      </div>

      <section id="alerts" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Alerts</h2>
          {alerts.some((row) => !row.read_at) ? (
            <form action={markAllNotificationsRead}>
              <button type="submit" className="text-sm underline">
                Mark all read
              </button>
            </form>
          ) : null}
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Wins and review notices show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 py-2 text-sm dark:border-zinc-800"
              >
                <div className="flex flex-col gap-0.5">
                  <span className={row.read_at ? "text-zinc-500" : "font-medium"}>
                    {row.title}
                  </span>
                  <span className="text-zinc-500">{row.body}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={row.href} className="underline">
                    Open
                  </Link>
                  {row.read_at ? null : (
                    <form action={markNotificationRead}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className="text-zinc-500 underline">
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Your listings</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-zinc-500">No listings yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mine.map((listing) => (
              <li
                key={listing.id}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 py-2 text-sm dark:border-zinc-800"
              >
                <span>
                  {listing.headline}{" "}
                  <span className="text-zinc-500">({listing.status})</span>
                </span>
                <Link href={`/sell/${listing.id}`} className="underline">
                  Edit / photos
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="watchlist" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Watchlist</h2>
        {watched.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Lots you watch will show up here.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {watched.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
