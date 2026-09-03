-- First-run insert used ON CONFLICT DO NOTHING, so an existing 1 MB bucket
-- would keep that cap. Align Storage with the app's 10 MB photo limit.

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'listing-images';
