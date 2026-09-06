# Product characterization — No Boring Cars

## Problem

Enthusiast and track cars in Israel are sold through Facebook groups, word of mouth, and generic classifieds. Those channels mix serious cars with noise, have no shared clock, and make it hard to trust the current price. Buyers cannot see a clean history of bids. Sellers cannot run a time-boxed sale that feels like an auction.

## Users

- **Browsers** — anonymous visitors who look at live, upcoming, and ended lots.
- **Bidders** — signed-in users with a public username who watch lots and place bids in ILS.
- **Sellers** — the same account type; they draft a lot, add photos, and submit it for review.
- **Admin** — a staff role that approves, sends back, or cancels listings.

There is no separate “dealer portal.” One person can sell and bid (not on their own lot).

## Client

The product is aimed at a small marketplace operator (the course team / a future “No Boring Cars” operator) who wants a Cars & Bids–style board focused on Israel, without building a full bank or title office.

## Business goals

1. only allow enthusiast cars or track cars to be listed on the platform.
2. Give sellers a credible, timed way to sell a non-boring car.
3. Give buyers a single place to compare lots, current price, and time left.
4. Keep junk and incomplete listings off the public board (admin review).
5. Keep money honest in the database (integer agorot, not floats).
6. Stay small: no in-app payments or shipping. After a win, buyer and seller settle off-platform. 

## Capabilities that support those goals

| Goal | Built capability |
|---|---|
| Discover cars | Home, `/auctions` search and filters, lot page with photos and specs |
| Timed sale | `upcoming` → `live` → `sold` / `unsold` / `reserve_not_met` via cron RPCs |
| Trust the price | `place_bid` in Postgres; last-two-minutes anti-snipe extension; Realtime refresh on the lot |
| Quality control | Draft → pending review → admin approve or send back |
| Repeat visits | Auth, username, watchlist, in-app alerts, optional email (Resend) |

## Core processes

1. **Register / log in** — email and password (Supabase Auth). First visit: choose a public username.
2. **Browse** — public lots only. Filter live / upcoming / ended, make, track cars. Search make/model/city.
3. **Watch** — logged-in, not the seller.
4. **Bid** — logged-in, lot `live`, amount ≥ next minimum, not own listing.
5. **Sell** — create draft, photos in Storage, save window, submit for review.
6. **Review** — admin approve (calendar) or send back to draft; optional cancel.
7. **Close** — cron opens due upcoming lots and closes expired live lots; winner + seller alerts/email when sold.

