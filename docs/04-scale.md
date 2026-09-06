# Basic scale — No Boring Cars

v1 is sized for **tens to low hundreds of users** and **tens of lots** (a campus/demo marketplace), not a national classifieds site.

## What happens at tens–hundreds of users

Auth and RLS are per request on Supabase. Concurrent bids on **one** live lot are serialized inside `place_bid` (the database is the lock). The Next.js server is stateless on Vercel; extra users mostly add PostgREST reads.

## Heavy queries

- `listPublicListings` loads **all** matching public rows, nested `bids (amount_agorot)`, then signs cover URLs. Fine for a small board; expensive if lots and bid rows grow without a cap.
- `listPublicMakes` scans public listings for distinct makes.
- Lot page loads images, mods, and bid history for one id (acceptable).
- Admin `listAdminListings` is the full table for staff.

**Indexes already in migrations:** `listings (status, ends_at)`, `(status, starts_at)`, seller+created; bids by listing; watches; notifications unread.

## Avoiding extra work

- Server Components fetch once per request; no client-side listing dump for first paint.
- Browse is **not** subscribed to Realtime (would be N connections). Only the **open lot** listens.
- Search tokens are capped (5) and stripped of PostgREST metacharacters.
- Notifications list is limited to 50.
- Cron uses the service role once per tick, not per user.

## Pagination

**Not used** on `/` or `/auctions`. That is a current limitation: the first “real” scale fix is `limit`/`range` (or keyset on `ends_at`) plus a signed cover URL batch that only loads the current page.

## Client vs server

Reads and money-sensitive writes stay on the server (Actions + RPCs). The client holds UI state and Realtime. Secrets (`SERVICE_ROLE`, `CRON_SECRET`, Resend) never go to the browser.

## Other limits today

- Vercel **Hobby** cron: **once daily**. Live auctions that must end on the minute need an external ping (`manual_cron.py` + `CRON_SECRET`) or a paid cron.
- Image pipeline: one signed URL per photo on the lot; many huge galleries would need smaller thumbs.
- `attachCoverUrls` does extra Storage round-trips after the listings query.

## Later, if the board grows

Paginate browse; store `high_bid_agorot` on `listings` to avoid aggregating every bid on the card query; connection-pool awareness; move minute ticks off Hobby; consider a queue for emails instead of doing them inside the cron request.
