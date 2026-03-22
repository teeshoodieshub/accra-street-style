alter table public.products
  add column if not exists use_design_selection boolean not null default false;
