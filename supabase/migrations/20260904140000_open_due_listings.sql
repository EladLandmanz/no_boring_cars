-- Same cron as close: upcoming lots whose start has passed become live.
-- If the window is already over, the close RPC in the same tick settles them.

create or replace function public.open_due_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with due as (
    select l.id
    from public.listings l
    where l.status = 'upcoming'
      and l.starts_at is not null
      and l.ends_at is not null
      and l.starts_at <= now()
    for update skip locked
  )
  update public.listings
  set status = 'live'
  where id in (select id from due);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.open_due_listings() from public, anon, authenticated;
grant execute on function public.open_due_listings() to service_role;
