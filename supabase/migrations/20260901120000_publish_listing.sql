-- Sellers cannot UPDATE status to live via RLS. Publish goes through this RPC.

create or replace function public.publish_listing(p_listing_id uuid)
returns public.listing_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_listing public.listings%rowtype;
  v_status public.listing_status;
begin
  if v_user is null then
    raise exception 'NBC_UNAUTHENTICATED';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'NBC_NOT_FOUND';
  end if;

  if v_listing.seller_id <> v_user then
    raise exception 'NBC_FORBIDDEN';
  end if;

  if v_listing.status not in ('draft', 'pending_review') then
    raise exception 'NBC_NOT_EDITABLE';
  end if;

  if v_listing.starts_at is null or v_listing.ends_at is null then
    raise exception 'NBC_MISSING_WINDOW';
  end if;

  if v_listing.ends_at <= v_listing.starts_at then
    raise exception 'NBC_BAD_WINDOW';
  end if;

  if v_listing.ends_at <= now() then
    raise exception 'NBC_ALREADY_ENDED';
  end if;

  if v_listing.starts_at > now() then
    v_status := 'upcoming';
  else
    v_status := 'live';
  end if;

  update public.listings
  set
    status = v_status,
    original_ends_at = coalesce(original_ends_at, ends_at)
  where id = p_listing_id;

  return v_status;
end;
$$;

revoke all on function public.publish_listing(uuid) from public, anon;
grant execute on function public.publish_listing(uuid) to authenticated;
