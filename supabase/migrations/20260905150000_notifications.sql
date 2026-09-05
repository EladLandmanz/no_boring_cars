create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  listing_id uuid references public.listings (id) on delete cascade,
  title text not null,
  body text not null,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_kind_check check (kind in ('won', 'review', 'sold'))
);

create unique index if not exists notifications_user_kind_listing
  on public.notifications (user_id, kind, listing_id);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;

create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on table public.notifications from anon, authenticated;
grant select, update on table public.notifications to authenticated;
