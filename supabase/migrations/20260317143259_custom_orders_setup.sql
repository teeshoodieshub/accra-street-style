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

create or replace function public.webhook_notify_order()
returns trigger as $$
begin
  perform net.http_post(
      url:='https://znprjbvvheqjqsgvrajo.supabase.co/functions/v1/notify-order',
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

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'notify_order_trigger') then
    create trigger notify_order_trigger
      after insert on public.custom_orders
      for each row
      execute function public.webhook_notify_order();
  end if;
end $$;
