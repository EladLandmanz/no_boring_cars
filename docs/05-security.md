# Basic security — No Boring Cars

## Authentication

Supabase Auth (email/password). Session is an HTTP cookie via `@supabase/ssr` (`getAll` / `setAll` only). `proxy.ts` refreshes tokens. `getUser()` on the server is the source of “who is logged in,” not a client-only flag.

## Authorization

- **RLS** on listings, images, bids, watches, notifications, etc. Anon sees public statuses only. Sellers see own drafts. `is_admin()` opens the admin queue.
- **RPCs** enforce bid rules (`place_bid`) and review (`submit_listing_for_review`, `publish_listing`, `reject_listing`).
- **App gates:** `/admin` layout redirects non-admins; `/sell` requires a user; seller cannot bid (UI + `NBC_OWN_LISTING`).
- **`profiles_guard`:** authenticated users cannot change `role`. Promoting an admin is a SQL Editor update.

## Logged-in only

Create/edit listings, upload photos, bid, watch, submit for review, alerts. Cron is not a user: it is a secret bearer token.

## Another user’s data

RLS `seller_id = auth.uid()` / `user_id = auth.uid()` on writes. Storage paths are `{listing_id}/…` with policies that require owning the listing (or public-visible listing for reads). You cannot guess another draft’s `/sell/[id]` and update it if RLS holds.

## Input validation

Browser constraints plus server parsing (`ilsToAgorot`, year range, file type/size). SQL `check` constraints on money and windows. Search strings cannot inject `or()` filters (`searchTokens`). Post-login `next=` is `safeNextPath`.

## API / cron

No public CRUD API. Cron: `Authorization: Bearer` compared with `timingSafeEqual`. Missing secret → unauthorized. Service role is used only in `lib/supabase/admin.ts` (cron, emails, some notifications), never `NEXT_PUBLIC_`.

## Secrets

In Vercel/Supabase dashboards and `.env.local` (gitignored). `.env.example` has names only. Anon key is public by design (RLS is the fence). Service role and `CRON_SECRET` are server-only.

## Remaining risks (v1)

- No payments → no PCI, but also no in-app fraud on cards.
- XSS: React escaping; we do not render raw HTML from listings (whitespace-pre-wrap text).
- Admin SQL privilege is powerful; protect the dashboard.
- Signed image URLs expire; leaking one URL is time-limited, not a full bucket list.
- Hobby cron secret on a guessable path is fine only if the secret is long and random.

Later: CAPTCHA on signup, rate-limit bids, verified email domain, 2FA for admin.
