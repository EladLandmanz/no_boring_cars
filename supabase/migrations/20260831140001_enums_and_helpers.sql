-- Phase 1: shared types and tiny trigger helpers.
-- Enums are real Postgres types: invalid values fail at insert time, not in React.
-- Idempotent: GitHub/Supabase may replay this on a DB that already has the types.

do $$ begin
  create type public.listing_status as enum (
    'draft',
    'pending_review',
    'upcoming',
    'live',
    'sold',
    'reserve_not_met',
    'unsold',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.drivetrain as enum ('fwd', 'rwd', 'awd', '4wd');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.transmission_type as enum (
    'manual',
    'automatic',
    'dct',
    'sequential',
    'cvt',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.title_status as enum (
    'clean',
    'salvage',
    'rebuilt',
    'lemon',
    'exempt',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.fuel_type as enum (
    'gasoline',
    'diesel',
    'hybrid',
    'plugin_hybrid',
    'electric',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.bid_status as enum ('accepted', 'rejected', 'outbid');
exception
  when duplicate_object then null;
end $$;

-- Keeps updated_at honest even if a client forgets to send it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
