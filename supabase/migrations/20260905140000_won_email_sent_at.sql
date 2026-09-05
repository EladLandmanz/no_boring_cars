-- Idempotent "you won" mail after close_expired_listings.

alter table public.listings
  add column if not exists won_email_sent_at timestamptz;
