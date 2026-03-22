-- Tees & Hoodies Consolidated Production Schema

-- 1. Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_net";

-- 2. Tables

-- Products Table
create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric not null,
  category text not null,
  featured_image_url text,
  image_urls text[] not null default '{}', -- Updated to array
  design_options text[] not null default '{}',
  use_design_selection boolean not null default false,
  colors text[] not null default '{}',
  sizes text[] not null default '{}',
  description text not null,
  specs text not null,
  is_new boolean default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Categories Table
create table if not exists public.categories (
  id text primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

-- Hero Images Table
create table if not exists public.hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Carts Table
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cart Items Table
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  size text not null,
  color text not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists cart_items_unique
  on public.cart_items (cart_id, product_id, size, color);

-- Store Orders Table (Expanded)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete set null,
  total numeric not null,
  status text not null default 'pending',
  customer_name text,
  phone_number text,
  email text,
  shipping_address text,
  shipping_city text,
  payment_method text,
  payment_status text default 'pending',
  payment_network text,
  payment_reference text,
  created_at timestamptz not null default now()
);

-- Order Items Table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  size text not null,
  color text not null,
  quantity integer not null,
  unit_price numeric not null
);

-- Custom Orders Setup
create type public.order_status as enum ('Pending', 'In Production', 'Ready', 'Delivered', 'Cancelled');

create table if not exists public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone_number text not null,
  email text not null,
  delivery_location text not null,
  product_type text not null,
  product_color text not null,
  sizes text[] not null default '{}', -- Replaced jsonb with text[] for consistency
  quantity integer not null,
  print_placement text not null,
  custom_text text,
  design_file_url text,
  order_notes text,
  status public.order_status not null default 'Pending',
  created_at timestamptz not null default now()
);

-- 3. Security (RLS)

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.hero_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_orders enable row level security;

-- Simple permissive policies
create policy "allow_anon_read" on public.products for select using (true);
create policy "allow_anon_read_cat" on public.categories for select using (true);
create policy "allow_anon_read_hero_images" on public.hero_images for select using (true);
create policy "full_access_products" on public.products for all using (true);
create policy "full_access_categories" on public.categories for all using (true);
create policy "full_access_hero_images" on public.hero_images for all using (true);
create policy "full_access_carts" on public.carts for all using (true);
create policy "full_access_cart_items" on public.cart_items for all using (true);
create policy "full_access_orders" on public.orders for all using (true);
create policy "full_access_order_items" on public.order_items for all using (true);
create policy "full_access_custom_orders" on public.custom_orders for all using (true);

-- 4. Initial Seed for Categories
insert into public.categories (id, name, description) values
('graphic-tees', 'Graphic Tees', 'Premium cotton tees with statement prints.'),
('hoodies', 'Hoodies', 'Heavyweight brushed fleece pullovers.'),
('sleeveless-hoodies', 'Sleeveless Hoodies', 'Street-ready tactical sleeveless cuts.')
on conflict (id) do nothing;

-- 5. Webhooks for Notifications
create or replace function public.webhook_notify_order()
returns trigger as $$
begin
  perform net.http_post(
      url:='https://' || current_setting('request.headers')::json->>'x-forwarded-host' || '/functions/v1/notify-order',
      headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', current_setting('request.headers')::json->>'authorization'
      ),
      body:=jsonb_build_object(
          'record', row_to_json(NEW)
      )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger notify_order_trigger
  after insert on public.custom_orders
  for each row
  execute function public.webhook_notify_order();
