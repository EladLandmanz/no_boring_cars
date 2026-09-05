-- RLS is the firewall. Grants say which commands exist; policies say which rows.

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "listings_select_public_or_own" on public.listings;
drop policy if exists "listings_insert_own_draft" on public.listings;
drop policy if exists "listings_update_own_editable" on public.listings;
drop policy if exists "listings_update_admin" on public.listings;
drop policy if exists "listings_delete_own_draft" on public.listings;
drop policy if exists "listing_images_select" on public.listing_images;
drop policy if exists "listing_images_write_owner" on public.listing_images;
drop policy if exists "listing_modifications_select" on public.listing_modifications;
drop policy if exists "listing_modifications_write_owner" on public.listing_modifications;
drop policy if exists "bids_select" on public.bids;
drop policy if exists "watches_select_own" on public.watches;
drop policy if exists "watches_insert_own" on public.watches;
drop policy if exists "watches_delete_own" on public.watches;

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_modifications enable row level security;
alter table public.bids enable row level security;
alter table public.watches enable row level security;

-- profiles
create policy "profiles_select_all"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- listings
create policy "listings_select_public_or_own"
  on public.listings
  for select
  to anon, authenticated
  using (
    status in (
      'upcoming',
      'live',
      'sold',
      'reserve_not_met',
      'unsold'
    )
    or seller_id = auth.uid()
    or public.is_admin()
  );

create policy "listings_insert_own_draft"
  on public.listings
  for insert
  to authenticated
  with check (
    seller_id = auth.uid()
    and status = 'draft'
  );

create policy "listings_update_own_editable"
  on public.listings
  for update
  to authenticated
  using (
    seller_id = auth.uid()
    and status in ('draft', 'pending_review')
  )
  with check (
    seller_id = auth.uid()
    and status in ('draft', 'pending_review')
  );

create policy "listings_update_admin"
  on public.listings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "listings_delete_own_draft"
  on public.listings
  for delete
  to authenticated
  using (
    seller_id = auth.uid()
    and status = 'draft'
  );

-- images / mods: visible if the parent listing is; writable while the seller can edit
create policy "listing_images_select"
  on public.listing_images
  for select
  to anon, authenticated
  using (
    public.listing_is_publicly_visible(listing_id)
    or public.listing_owned_by_me(listing_id)
    or public.is_admin()
  );

create policy "listing_images_write_owner"
  on public.listing_images
  for all
  to authenticated
  using (
    public.listing_owned_by_me(listing_id)
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.status in ('draft', 'pending_review')
    )
  )
  with check (
    public.listing_owned_by_me(listing_id)
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.status in ('draft', 'pending_review')
    )
  );

create policy "listing_modifications_select"
  on public.listing_modifications
  for select
  to anon, authenticated
  using (
    public.listing_is_publicly_visible(listing_id)
    or public.listing_owned_by_me(listing_id)
    or public.is_admin()
  );

create policy "listing_modifications_write_owner"
  on public.listing_modifications
  for all
  to authenticated
  using (
    public.listing_owned_by_me(listing_id)
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.status in ('draft', 'pending_review')
    )
  )
  with check (
    public.listing_owned_by_me(listing_id)
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.status in ('draft', 'pending_review')
    )
  );

-- bids: read history on public (or own) listings. No direct insert.
create policy "bids_select"
  on public.bids
  for select
  to anon, authenticated
  using (
    public.listing_is_publicly_visible(listing_id)
    or public.listing_owned_by_me(listing_id)
    or bidder_id = auth.uid()
    or public.is_admin()
  );

-- watches: only the owner
create policy "watches_select_own"
  on public.watches
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "watches_insert_own"
  on public.watches
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "watches_delete_own"
  on public.watches
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Tighten table grants. place_bid is the only user write path for bids.
revoke all on table public.bids from anon, authenticated;
grant select on table public.bids to anon, authenticated;

revoke all on function public.place_bid(uuid, integer) from public, anon;
grant execute on function public.place_bid(uuid, integer) to authenticated;

revoke all on function public.close_expired_listings() from public, anon, authenticated;
grant execute on function public.close_expired_listings() to service_role;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.listing_is_publicly_visible(uuid) to anon, authenticated;
grant execute on function public.listing_owned_by_me(uuid) to anon, authenticated;

-- Live bid ticker (Next.js client will subscribe later).
alter table public.bids replica identity default;

do $$
begin
  alter publication supabase_realtime add table public.bids;
exception
  when duplicate_object then
    null;
  when undefined_object then
    null;
end;
$$;
