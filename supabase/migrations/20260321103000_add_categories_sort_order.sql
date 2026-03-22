alter table public.categories
  add column if not exists sort_order integer;

with ranked_categories as (
  select
    id,
    row_number() over (order by name asc, id asc) - 1 as next_sort_order
  from public.categories
)
update public.categories c
set sort_order = r.next_sort_order
from ranked_categories r
where c.id = r.id
  and (c.sort_order is null or c.sort_order = 0);

alter table public.categories
  alter column sort_order set default 0;

update public.categories
set sort_order = 0
where sort_order is null;

alter table public.categories
  alter column sort_order set not null;

create index if not exists categories_sort_order_idx
  on public.categories (sort_order);
