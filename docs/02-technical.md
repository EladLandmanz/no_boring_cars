# Technical planning — No Boring Cars

## Components

- **Browser** — React pages and a few client islands (bid panel, search, Realtime, photo picker).
- **Next.js server** — Server Components for reads; Server Actions for mutations; `proxy.ts` refreshes Auth cookies.
- **Supabase** — Postgres + RLS, Auth, Storage (`listing-images`), Realtime on `bids` and `listings`.
- **Vercel** — hosts the app; Hobby cron hits `/api/cron/close-listings` once per day.
- **Resend** — optional transactional mail (review + winner).

Almost all writes go through **Server Actions**, not a public REST API. The only Route Handler is the **cron** endpoint (Bearer `CRON_SECRET`).

## Data flow

1. Page load: server `createClient()` (cookie JWT) → PostgREST under RLS → HTML.
2. Bid / save listing: form → Server Action → `rpc` or table write → `revalidatePath` / redirect.
3. Live lot: browser Supabase Realtime → refetch snapshot (not `router.refresh()` alone).
4. Tick: cron or local script → service role → `open_due_listings` then `close_expired_listings` → notify winners.

Money is always **integer agorot** (₪1 = 100). The UI converts to/from ILS.

## Main entities

`profiles` (1:1 `auth.users`, `role` user|admin) · `listings` · `listing_images` · `listing_modifications` · `bids` · `watches` · `notifications`.

Listing statuses: `draft`, `pending_review`, `upcoming`, `live`, `sold`, `reserve_not_met`, `unsold`, `cancelled`.

Core RPCs: `place_bid`, `submit_listing_for_review`, `publish_listing` (admin), `reject_listing`, `open_due_listings`, `close_expired_listings`. Helpers: `is_admin()`, `listing_owned_by_me()`, `profiles_guard` (clients cannot change `role`).

## Pages

| Route | Who |
|---|---|
| `/` `/auctions` `/auctions/[slug]` | Public (pending lots: seller or admin) |
| `/login` `/signup` | Anonymous |
| `/account` `/account/username` | Logged-in |
| `/sell` `/sell/[id]` | Seller |
| `/admin` | `role = admin` |

## Folder structure (short)

`app/` pages and cron route · `actions/` mutations · `components/` UI · `lib/` money, queries, supabase, email · `supabase/migrations/` · `e2e/` Playwright · `*.test.ts(x)` Vitest.

## CRUD (business, not raw SQL)

- **Create** draft listing, images, watch, bid (via RPC), notification (service role).
- **Read** public lists, lot detail, account, admin queue (RLS).
- **Update** own draft/pending listing, cover photo, mark alerts read, admin cancel/approve/reject.
- **Delete** own draft, own images, own watch. Bids are not deleted by users.

## State

No Redux. Server data is the source of truth. Client state is local: search debounce, bid form `useActionState`, lot Realtime snapshot, file-input labels.

## Validation and errors

HTML `required` / min on forms. Server: `ilsToAgorot`, windows, photo types/size. Postgres raises `NBC_*`; `mapNbcError` turns them into copy. Cron auth uses `timingSafeEqual`. Redirects: `safeNextPath` (same-origin `/` only).

## UX (v1)

Warm gray page, white cards, black header, red for Sold / primary forms, green for Live. Sell uses a visible **Add photos** button. Admin can approve on the pending lot page and return to `/admin`.

## Libraries (why)

`next` + `react` (required stack) · `@supabase/ssr` + `@supabase/supabase-js` (cookie Auth + RLS) · `resend` (email) · Tailwind 4 (CSS) · Vitest / Testing Library / Playwright (tests).
