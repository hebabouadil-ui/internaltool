-- Run this in your Supabase SQL editor

-- Trips (optional grouping for expenses)
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  purchase_price numeric(10,2) not null check (purchase_price >= 0),
  quantity integer not null check (quantity > 0),
  category text,
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock','ready','sold')),
  manual_price numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(10,2) not null check (amount > 0),
  date date not null,
  category text not null default 'Other',
  note text,
  trip_id uuid references public.trips(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Enable RLS (Row Level Security)
alter table public.products enable row level security;
alter table public.expenses enable row level security;
alter table public.trips enable row level security;

-- Allow all operations for now (private tool — no auth required)
create policy "Allow all on products" on public.products for all using (true) with check (true);
create policy "Allow all on expenses" on public.expenses for all using (true) with check (true);
create policy "Allow all on trips" on public.trips for all using (true) with check (true);

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public read + authenticated write on storage
create policy "Public read images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Allow upload images" on storage.objects for insert with check (bucket_id = 'product-images');
create policy "Allow update images" on storage.objects for update using (bucket_id = 'product-images');
create policy "Allow delete images" on storage.objects for delete using (bucket_id = 'product-images');
