-- Create product_images bucket
insert into storage.buckets (id, name, public)
values ('product_images', 'product_images', true)
on conflict (id) do nothing;

-- RLS policies for product_images bucket
create policy "product_images_insert_admin" on storage.objects for insert with check ( bucket_id = 'product_images' );
create policy "product_images_select_public" on storage.objects for select using ( bucket_id = 'product_images' );
create policy "product_images_update_admin" on storage.objects for update using ( bucket_id = 'product_images' );
create policy "product_images_delete_admin" on storage.objects for delete using ( bucket_id = 'product_images' );
