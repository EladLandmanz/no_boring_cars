# Test characterization — No Boring Cars

“Works” means: public browse is accurate, only the right people can mutate data, bids follow RPC rules, and review/cron change listing status as designed.

## Automated (implemented)

| Area | What | Tool |
|---|---|---|
| Money | Starting vs high bid; next bid; ILS ↔ agorot; slugify | Vitest |
| Browse URLs | Search tokens, filters, `safeNextPath` | Vitest |
| UI | Add photos / Clear; Live filter chip | Testing Library |
| Smoke | Home, `/auctions?status=live`, login form | Playwright |

Run: `pnpm test` · `pnpm test:e2e` (needs Chromium: `pnpm exec playwright install chromium`). E2E expects the app on port 3000 with `.env.local`.

These tests do **not** log in or hit Postgres RPCs. Core flows below are **manual** (allowed by the assignment).

## Manual — core features

Use production <https://no-boring-cars.vercel.app> or local `pnpm dev`.

1. Home shows live vs other lots; opening a card reaches `/auctions/[slug]`.
2. Search and filters change the grid; Track cars limits to `track_use`.
3. Sign up / log in / log out; new user is forced to pick a username.
4. Sell: create draft, **Add photos**, save, submit for review (needs photo + start/end).
5. Admin: pending lot shows Approve / Send back; back link goes to `/admin`; approve puts the lot on the public calendar.
6. Bid on a **live** lot as a second user; price and history update (Realtime if another tab is open).
7. Watch / unwatch; lot appears under Account → Watchlist.
8. After a lot’s `ends_at`, run a cron tick (or wait for the daily Vercel cron) and confirm status `sold` / `unsold` / `reserve_not_met`.

## Manual — invalid input

- Bid below minimum → `NBC_TOO_LOW` copy.
- Bid on own lot → blocked in UI and RPC (`NBC_OWN_LISTING`).
- Bid while logged out → login link.
- Submit review without photos or without a time window → RPC error copy.
- Login with wrong password → Auth error.
- Open redirect: `/login?next=https://evil.test` must not leave the site (`safeNextPath`).

## Manual — permissions

| Actor | Expect |
|---|---|
| Anonymous | Public lots only; `/sell` and `/admin` redirect |
| User | Own drafts; cannot set `profiles.role`; cannot bid on own lot |
| Other user | Cannot edit someone else’s draft |
| Admin | `/admin`, approve/reject/cancel; promote admin only in SQL Editor |

## Database / RPC (SQL Editor or two accounts)

- Insert a bid as the seller → RPC fails.
- `ends_at` in the past on a live lot → `close_expired_listings` sets terminal status; with bids ≥ reserve → `winner_id` + `sold_price_agorot`.
- `upcoming` with `starts_at` ≤ now → `open_due_listings` → `live`.
- Draft is not in `listPublicListings`.

## Edge cases

- Last 2 minutes: a valid bid extends `ends_at`.
- Soft close: opening the lot page does **not** close the auction (only cron/RPC).
- Duplicate watch unique constraint; second toggle removes the row.
- Cron without `Authorization: Bearer $CRON_SECRET` → 401.
- Missing `open_due_listings` on an old DB → cron still closes (notes in JSON).

## UI (quick)

Header black; Live green; Sold red; Add photos is a real button; pending admin back link is “Admin”.

## Sign-off

Record date, environment (local / production), and pass/fail for the numbered manual list when you demo.
