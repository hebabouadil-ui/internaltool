-- Run this in Supabase SQL Editor to fix image upload permissions

-- Create bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
on conflict (id) do update set public = true;

-- Drop old policies if they exist
drop policy if exists "Public read images" on storage.objects;
drop policy if exists "Allow upload images" on storage.objects;
drop policy if exists "Allow update images" on storage.objects;
drop policy if exists "Allow delete images" on storage.objects;

-- Recreate clean policies
create policy "Public read images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Allow upload images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

create policy "Allow update images"
  on storage.objects for update
  using (bucket_id = 'product-images');

create policy "Allow delete images"
  on storage.objects for delete
  using (bucket_id = 'product-images');
