-- Profiles hang off auth.users. We never store passwords here.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  location text,
  avatar_url text,
  has_chosen_username boolean not null default false,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'admin')),
  constraint profiles_username_format check (
    username ~ '^[a-z0-9_]{3,24}$'
  )
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- New Auth users get a placeholder username they can change later.
-- SECURITY DEFINER: the insert runs with the function owner's rights so
-- it can write profiles even though the signup path is not a normal user UPDATE.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clients (auth.uid() present) cannot promote themselves.
-- has_chosen_username may only flip false → true in the same UPDATE that
-- changes username (the complete-profile step).
-- Dashboard / service_role typically have auth.uid() = null.
create or replace function public.profiles_guard()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'NBC_ROLE_IMMUTABLE';
  end if;

  if new.has_chosen_username is distinct from old.has_chosen_username
     and auth.uid() is not null then
    if not (
      old.has_chosen_username = false
      and new.has_chosen_username = true
      and new.username is distinct from old.username
    ) then
      raise exception 'NBC_USERNAME_FLAG';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id),
  status public.listing_status not null default 'draft',
  slug text not null unique,
  headline text not null,
  description text not null,
  year smallint not null,
  make text not null,
  model text not null,
  trim text,
  vin text,
  mileage integer not null,
  drivetrain public.drivetrain not null,
  transmission public.transmission_type not null,
  gears smallint,
  engine text,
  horsepower integer,
  fuel public.fuel_type not null default 'gasoline',
  exterior_color text,
  interior_color text,
  title_status public.title_status not null,
  is_modified boolean not null default false,
  modifications_summary text,
  service_notes text,
  track_use boolean not null default false,
  location_city text not null,
  location_region text not null,
  location_country char(2) not null default 'IL',
  -- Money is integer agorot (1 ILS = 100 agorot). Never a float.
  starting_bid_agorot integer not null,
  reserve_agorot integer,
  bid_increment_agorot integer not null default 10000, -- ₪100
  starts_at timestamptz,
  ends_at timestamptz,
  original_ends_at timestamptz,
  sold_price_agorot integer,
  winner_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_year_check check (year between 1900 and 2100),
  constraint listings_mileage_check check (mileage >= 0),
  constraint listings_starting_bid_check check (starting_bid_agorot > 0),
  constraint listings_increment_check check (bid_increment_agorot > 0),
  constraint listings_reserve_check check (
    reserve_agorot is null or reserve_agorot >= starting_bid_agorot
  ),
  constraint listings_window_check check (
    starts_at is null
    or ends_at is null
    or ends_at > starts_at
  )
);

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create index if not exists listings_status_ends_at_idx
  on public.listings (status, ends_at);

create index if not exists listings_status_starts_at_idx
  on public.listings (status, starts_at);

create index if not exists listings_seller_created_idx
  on public.listings (seller_id, created_at desc);

-- Same VIN cannot be listed twice while it is an active or sold record.
create unique index if not exists listings_vin_unique_active
  on public.listings (vin)
  where vin is not null
    and status not in ('cancelled', 'draft');

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  alt text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists listing_images_listing_idx
  on public.listing_images (listing_id, sort_order);

create unique index if not exists listing_images_one_cover
  on public.listing_images (listing_id)
  where is_cover;

create table if not exists public.listing_modifications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  category text not null,
  label text not null,
  sort_order integer not null default 0,
  constraint listing_modifications_category_check check (
    category in (
      'engine',
      'suspension',
      'brakes',
      'aero',
      'interior',
      'wheels',
      'exhaust',
      'electronics',
      'safety',
      'other'
    )
  )
);

create index if not exists listing_modifications_listing_idx
  on public.listing_modifications (listing_id, sort_order);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  bidder_id uuid not null references public.profiles (id),
  amount_agorot integer not null,
  status public.bid_status not null default 'accepted',
  created_at timestamptz not null default now(),
  constraint bids_amount_check check (amount_agorot > 0)
);

create index if not exists bids_listing_created_idx
  on public.bids (listing_id, created_at desc);

create index if not exists bids_listing_amount_idx
  on public.bids (listing_id, amount_agorot desc);

create table if not exists public.watches (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists watches_listing_idx on public.watches (listing_id);
