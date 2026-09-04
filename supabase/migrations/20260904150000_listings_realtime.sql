-- Bid ticker also watches listing row updates (anti-snipe clock, upcoming → live).

alter table public.listings replica identity default;

do $$
begin
  alter publication supabase_realtime add table public.listings;
exception
  when duplicate_object then
    null;
  when undefined_object then
    null;
end;
$$;
