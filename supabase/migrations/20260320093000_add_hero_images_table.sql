create table if not exists public.hero_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists hero_images_sort_order_idx on public.hero_images (sort_order);

alter table public.hero_images enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'hero_images'
      and policyname = 'hero_images_read_all'
  ) then
    create policy "hero_images_read_all" on public.hero_images
      for select using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'hero_images'
      and policyname = 'hero_images_write_all'
  ) then
    create policy "hero_images_write_all" on public.hero_images
      for all using (true) with check (true);
  end if;
end $$;
