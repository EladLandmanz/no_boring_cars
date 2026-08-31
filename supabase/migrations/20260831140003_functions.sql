-- Helpers used inside RLS and RPCs.
-- SECURITY DEFINER + fixed search_path: the function reads profiles/listings
-- with the owner's rights so policies do not recurse into themselves.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.listing_is_publicly_visible(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listings
    where id = p_id
      and status in (
        'upcoming',
        'live',
        'sold',
        'reserve_not_met',
        'unsold'
      )
  );
$$;

create or replace function public.listing_owned_by_me(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listings
    where id = p_id
      and seller_id = auth.uid()
  );
$$;

-- All bids go through this. Table INSERT is not granted to users.
-- FOR UPDATE on the listing row serializes two people bidding at once.

create or replace function public.place_bid(
  p_listing_id uuid,
  p_amount_agorot integer
)
returns table (
  bid_id uuid,
  listing_id uuid,
  amount_agorot integer,
  high_bid_agorot integer,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_high integer;
  v_min integer;
  v_bid_id uuid;
  v_ends timestamptz;
begin
  if v_user is null then
    raise exception 'NBC_UNAUTHENTICATED';
  end if;

  if p_amount_agorot is null or p_amount_agorot <= 0 then
    raise exception 'NBC_INVALID_AMOUNT';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user
      and has_chosen_username
  ) then
    raise exception 'NBC_PROFILE_INCOMPLETE';
  end if;

  select *
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'NBC_NOT_FOUND';
  end if;

  if v_listing.seller_id = v_user then
    raise exception 'NBC_OWN_LISTING';
  end if;

  if v_listing.status <> 'live'
     or v_listing.starts_at is null
     or v_listing.ends_at is null
     or v_listing.starts_at > now()
     or v_listing.ends_at <= now() then
    raise exception 'NBC_NOT_LIVE';
  end if;

  select max(b.amount_agorot)
  into v_high
  from public.bids b
  where b.listing_id = p_listing_id
    and b.status = 'accepted';

  if v_high is null then
    v_min := v_listing.starting_bid_agorot;
  else
    v_min := v_high + v_listing.bid_increment_agorot;
  end if;

  if p_amount_agorot < v_min then
    raise exception 'NBC_TOO_LOW' using hint = v_min::text;
  end if;

  insert into public.bids (listing_id, bidder_id, amount_agorot, status)
  values (p_listing_id, v_user, p_amount_agorot, 'accepted')
  returning id into v_bid_id;

  v_ends := v_listing.ends_at;

  if v_listing.ends_at - now() < interval '2 minutes' then
    update public.listings
    set ends_at = now() + interval '2 minutes'
    where id = p_listing_id
    returning public.listings.ends_at into v_ends;
  end if;

  return query
  select
    v_bid_id,
    p_listing_id,
    p_amount_agorot,
    p_amount_agorot,
    v_ends;
end;
$$;

-- Called by a later cron job with the service role, not by browsers.

create or replace function public.close_expired_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_high integer;
  v_winner uuid;
  v_count integer := 0;
begin
  for r in
    select l.id, l.reserve_agorot
    from public.listings l
    where l.status = 'live'
      and l.ends_at <= now()
    for update skip locked
  loop
    select b.amount_agorot, b.bidder_id
    into v_high, v_winner
    from public.bids b
    where b.listing_id = r.id
      and b.status = 'accepted'
    order by b.amount_agorot desc, b.created_at asc
    limit 1;

    if v_winner is null then
      update public.listings
      set status = 'unsold'
      where id = r.id;
    elsif r.reserve_agorot is not null and v_high < r.reserve_agorot then
      update public.listings
      set status = 'reserve_not_met'
      where id = r.id;
    else
      update public.listings
      set
        status = 'sold',
        winner_id = v_winner,
        sold_price_agorot = v_high
      where id = r.id;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
