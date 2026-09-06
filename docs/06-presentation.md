# Presentation outline (10–15 minutes)

Live app: https://no-boring-cars.vercel.app  
Repo: https://github.com/EladLandmanz/no_boring_cars

**~1 min — What it is**  
Timed auctions for enthusiast/track cars in Israel. Not a Facebook group and not a bank.

**~1 min — Problem and users**  
Sellers need a clock and a public price. Buyers need one board. Users: browsers, bidders/sellers, admin. Client: a small marketplace operator.

**~1 min — Business value**  
Enable a sale process (listing → review → live bids → close). Settlement after win is off-platform on purpose.

**~2 min — Demo**  
Home → a live lot (price, specs). Filters. Mention Sell + Admin review if logged in. Optional: second browser bid and green price flash.

**~3 min — How it is built**  
Next.js on Vercel, Supabase Auth + Postgres + Storage. Server Actions for writes; one cron Route Handler. Cookies + RLS. Money = agorot. `place_bid` in SQL (own-lot ban, min increment, 2-minute extension). Cron opens/closes; page load does not close auctions.

**~1 min — Database**  
profiles, listings (+ images, mods), bids, watches, notifications. Status machine: draft → pending_review → upcoming/live → terminal.

**~1 min — Tests**  
Vitest + RTL + Playwright smokes (`pnpm test`, `pnpm test:e2e`). Core bid/review/cron: documented manual tests in `docs/03-tests.md`.

**~1 min — Scale**  
OK for tens of lots; no browse pagination; indexes on status/time; Realtime only on the lot page; Hobby cron is daily.

**~1 min — Security**  
Cookie auth, RLS, RPCs, cron bearer secret, no service role in the client, `safeNextPath`.

**~1 min — If we had more time**  
Pagination, in-app payment or clearer post-win flow, minute-level hosted cron, more automated auth/bid tests, verified email domain.

**Backup answers**  
Why not close on page view? Avoids random visitors finishing auctions. Why Server Actions? Mutations with cookies, not a public API. Why review? Keep the public board trusted.
