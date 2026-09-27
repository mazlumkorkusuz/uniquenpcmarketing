-- Public bucket for mail account logos and banners (referenced from outgoing emails,
-- so objects must be publicly readable). Only signed-in users can upload or change them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mail-assets', 'mail-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists mail_assets_auth_insert on storage.objects;
create policy mail_assets_auth_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mail-assets');

drop policy if exists mail_assets_auth_update on storage.objects;
create policy mail_assets_auth_update on storage.objects
  for update to authenticated
  using (bucket_id = 'mail-assets');

drop policy if exists mail_assets_auth_delete on storage.objects;
create policy mail_assets_auth_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'mail-assets');
