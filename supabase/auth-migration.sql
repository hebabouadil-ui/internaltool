-- Run this in Supabase SQL Editor

-- Add creator columns to products
alter table public.products
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists creator_name text;

-- Add creator columns to expenses
alter table public.expenses
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists creator_name text;

-- Update RLS: require authentication for all tables

-- Products
drop policy if exists "Allow all on products" on public.products;
create policy "Voir les produits" on public.products for select to authenticated using (true);
create policy "Ajouter un produit" on public.products for insert to authenticated with check (true);
create policy "Modifier un produit" on public.products for update to authenticated using (true);
create policy "Supprimer un produit" on public.products for delete to authenticated using (true);

-- Expenses
drop policy if exists "Allow all on expenses" on public.expenses;
create policy "Voir les dépenses" on public.expenses for select to authenticated using (true);
create policy "Ajouter une dépense" on public.expenses for insert to authenticated with check (true);
create policy "Modifier une dépense" on public.expenses for update to authenticated using (true);
create policy "Supprimer une dépense" on public.expenses for delete to authenticated using (true);

-- Trips
drop policy if exists "Allow all on trips" on public.trips;
create policy "Voir les voyages" on public.trips for select to authenticated using (true);
create policy "Ajouter un voyage" on public.trips for insert to authenticated with check (true);
create policy "Modifier un voyage" on public.trips for update to authenticated using (true);
create policy "Supprimer un voyage" on public.trips for delete to authenticated using (true);

-- Storage: allow authenticated users to upload images
drop policy if exists "Allow upload images" on storage.objects;
drop policy if exists "Allow update images" on storage.objects;
drop policy if exists "Allow delete images" on storage.objects;

create policy "Upload images (auth)" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "Update images (auth)" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "Delete images (auth)" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
