-- Supabase schema for products, carts, and orders

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric not null,
  category text not null,
  image_url text not null,
  colors text[] not null,
  sizes text[] not null,
  description text not null,
  specs text not null,
  is_new boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete set null,
  total numeric not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  size text not null,
  color text not null,
  quantity integer not null,
  unit_price numeric not null
);

-- RLS policies (open for demo; tighten for production)
alter table public.products enable row level security;
alter table public.hero_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products') then
    create policy "products_read_all" on public.products for select using (true);
    create policy "products_write_all" on public.products for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hero_images') then
    create policy "hero_images_read_all" on public.hero_images for select using (true);
    create policy "hero_images_write_all" on public.hero_images for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'carts') then
    create policy "carts_all" on public.carts for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cart_items') then
    create policy "cart_items_all" on public.cart_items for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders') then
    create policy "orders_all" on public.orders for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items') then
    create policy "order_items_all" on public.order_items for all using (true) with check (true);
  end if;
end $$;

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
  sizes jsonb not null,
  quantity integer not null,
  print_placement text not null,
  custom_text text,
  design_file_url text,
  order_notes text,
  status public.order_status not null default 'Pending',
  created_at timestamptz not null default now()
);

alter table public.custom_orders enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'custom_orders' and policyname = 'custom_orders_insert_all') then
    create policy "custom_orders_insert_all" on public.custom_orders for insert with check (true);
    create policy "custom_orders_select_all" on public.custom_orders for select using (true);
    create policy "custom_orders_update_all" on public.custom_orders for update using (true);
    create policy "custom_orders_delete_all" on public.custom_orders for delete using (true);
  end if;
end $$;

-- Storage Bucket Setup

insert into storage.buckets (id, name, public) 
values ('design_uploads', 'design_uploads', true)
on conflict (id) do nothing;

create policy "design_uploads_insert_all" on storage.objects for insert with check ( bucket_id = 'design_uploads' );
create policy "design_uploads_select_all" on storage.objects for select using ( bucket_id = 'design_uploads' );
create policy "design_uploads_update_all" on storage.objects for update using ( bucket_id = 'design_uploads' );
create policy "design_uploads_delete_all" on storage.objects for delete using ( bucket_id = 'design_uploads' );

-- Webhooks for Notifications
create extension if not exists "pg_net";

create or trigger notify_order_trigger
  after insert on public.custom_orders
  for each row
  execute function public.webhook_notify_order();

create or replace function public.webhook_notify_order()
returns trigger as $$
begin
  perform net.http_post(
      url:='https://YOUR_PROJECT_REF_OR_URL.supabase.co/functions/v1/notify-order',
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
