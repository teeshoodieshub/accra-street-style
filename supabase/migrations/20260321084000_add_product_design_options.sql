alter table public.products
  add column if not exists design_options text[] not null default '{}';
