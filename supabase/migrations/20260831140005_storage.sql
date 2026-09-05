-- Storage buckets + object policies. Safe to run on hosted Supabase.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "listing_images_select_visible" on storage.objects;
drop policy if exists "listing_images_insert_owner" on storage.objects;
drop policy if exists "listing_images_delete_owner" on storage.objects;
drop policy if exists "avatars_select_all" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

-- Object names: listing-images/{listing_uuid}/{file}
--               avatars/{user_uuid}/{file}

create policy "listing_images_select_visible"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'listing-images'
    and (
      public.listing_is_publicly_visible(((storage.foldername(name))[1])::uuid)
      or public.listing_owned_by_me(((storage.foldername(name))[1])::uuid)
      or public.is_admin()
    )
  );

create policy "listing_images_insert_owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and public.listing_owned_by_me(((storage.foldername(name))[1])::uuid)
    and exists (
      select 1
      from public.listings l
      where l.id = ((storage.foldername(name))[1])::uuid
        and l.status in ('draft', 'pending_review')
    )
  );

create policy "listing_images_delete_owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and public.listing_owned_by_me(((storage.foldername(name))[1])::uuid)
    and exists (
      select 1
      from public.listings l
      where l.id = ((storage.foldername(name))[1])::uuid
        and l.status in ('draft', 'pending_review')
    )
  );

create policy "avatars_select_all"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
