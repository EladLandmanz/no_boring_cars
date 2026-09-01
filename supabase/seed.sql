-- Demo auctions. Requires at least one row in public.profiles (sign up first).
-- Re-runnable: deletes previous seed slugs, then inserts again.

do $$
declare
  v_seller uuid;
  v_live uuid;
begin
  select id into v_seller
  from public.profiles
  order by created_at asc
  limit 1;

  if v_seller is null then
    raise exception 'NBC_SEED: sign up in the app first, then run this file again.';
  end if;

  delete from public.listings
  where slug in (
    '1999-mazda-mx5-track',
    '1988-bmw-e30-325is',
    '2001-porsche-996-carrera'
  );

  insert into public.listings (
    seller_id,
    status,
    slug,
    headline,
    description,
    year,
    make,
    model,
    trim,
    vin,
    mileage,
    drivetrain,
    transmission,
    gears,
    engine,
    horsepower,
    fuel,
    exterior_color,
    interior_color,
    title_status,
    is_modified,
    modifications_summary,
    service_notes,
    track_use,
    location_city,
    location_region,
    location_country,
    starting_bid_agorot,
    reserve_agorot,
    bid_increment_agorot,
    starts_at,
    ends_at,
    original_ends_at
  )
  values (
    v_seller,
    'live',
    '1999-mazda-mx5-track',
    '1999 Mazda MX-5 — honest track toy',
    'A well-sorted NA Miata used for HPDE, not a trailer queen. Fresh fluids, no known accidents, and a stack of receipts in the glovebox. Comes with a spare set of wheels.',
    1999,
    'Mazda',
    'MX-5',
    'NB',
    'JM1NB3530X0123456',
    142000,
    'rwd',
    'manual',
    5,
    '1.8L I4',
    140,
    'gasoline',
    'Silver',
    'Black',
    'clean',
    true,
    'Suspension, brakes, and a roll bar. Street legal, track ready.',
    'Timing belt and water pump at 138k miles.',
    true,
    'Tel Aviv',
    'Tel Aviv',
    'IL',
    2500000,
    4000000,
    10000,
    now() - interval '1 day',
    now() + interval '5 days',
    now() + interval '5 days'
  )
  returning id into v_live;

  insert into public.listing_modifications (listing_id, category, label, sort_order)
  values
    (v_live, 'suspension', 'Ohlins road & track coilovers', 0),
    (v_live, 'brakes', 'Wilwood 4-piston front kit', 1),
    (v_live, 'safety', 'Hard Dog roll bar', 2),
    (v_live, 'wheels', 'Enkei RPF1 15x8', 3);

  insert into public.listings (
    seller_id,
    status,
    slug,
    headline,
    description,
    year,
    make,
    model,
    trim,
    vin,
    mileage,
    drivetrain,
    transmission,
    gears,
    engine,
    horsepower,
    fuel,
    exterior_color,
    interior_color,
    title_status,
    is_modified,
    track_use,
    location_city,
    location_region,
    starting_bid_agorot,
    bid_increment_agorot,
    starts_at,
    ends_at,
    original_ends_at
  )
  values (
    v_seller,
    'upcoming',
    '1988-bmw-e30-325is',
    '1988 BMW 325is — unmolested E30',
    'Mostly original 325is. Sunroof, sport seats, and the kind of patina you cannot buy in a catalog. Auction opens tomorrow.',
    1988,
    'BMW',
    '325is',
    null,
    'WBAAB9305J8765432',
    198400,
    'rwd',
    'manual',
    5,
    '2.5L I6',
    168,
    'gasoline',
    'Diamond Black',
    'Tan',
    'clean',
    false,
    false,
    'Haifa',
    'Haifa',
    5500000,
    25000,
    now() + interval '1 day',
    now() + interval '8 days',
    now() + interval '8 days'
  );

  insert into public.listings (
    seller_id,
    status,
    slug,
    headline,
    description,
    year,
    make,
    model,
    trim,
    vin,
    mileage,
    drivetrain,
    transmission,
    gears,
    engine,
    horsepower,
    fuel,
    exterior_color,
    interior_color,
    title_status,
    is_modified,
    track_use,
    location_city,
    location_region,
    starting_bid_agorot,
    sold_price_agorot,
    winner_id,
    starts_at,
    ends_at,
    original_ends_at
  )
  values (
    v_seller,
    'sold',
    '2001-porsche-996-carrera',
    '2001 Porsche 911 Carrera — sold',
    'Clean 996 that already found a home. Left here so the board is not empty after a sale.',
    2001,
    'Porsche',
    '911',
    'Carrera',
    'WP0AA29971S654321',
    72000,
    'rwd',
    'manual',
    6,
    '3.4L flat-six',
    300,
    'gasoline',
    'Seal Grey',
    'Black',
    'clean',
    false,
    false,
    'Herzliya',
    'Tel Aviv',
    18000000,
    21200000,
    v_seller,
    now() - interval '10 days',
    now() - interval '3 days',
    now() - interval '3 days'
  );
end;
$$;
