-- Provision protected storage for teaching resources and mirror app-level access rules.

insert into storage.buckets (id, name, public, file_size_limit)
values ('resource-files', 'resource-files', false, 26214400)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "resource_files_storage_select" on storage.objects;
create policy "resource_files_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resource-files'
  and (
    exists (
      select 1
      from public.resource_files rf
      where rf.file_path = storage.objects.bucket_id || '/' || storage.objects.name
        and public.can_view_resource(rf.resource_id)
    )
    or exists (
      select 1
      from public.spaces s
      where s.slug = split_part(storage.objects.name, '/', 1)
        and public.is_space_manager(s.id)
    )
  )
);

drop policy if exists "resource_files_storage_insert" on storage.objects;
create policy "resource_files_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resource-files'
  and exists (
    select 1
    from public.spaces s
    where s.slug = split_part(storage.objects.name, '/', 1)
      and public.is_space_manager(s.id)
  )
);

drop policy if exists "resource_files_storage_delete" on storage.objects;
create policy "resource_files_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resource-files'
  and (
    exists (
      select 1
      from public.resource_files rf
      join public.resources r
        on r.id = rf.resource_id
      where rf.file_path = storage.objects.bucket_id || '/' || storage.objects.name
        and public.is_space_manager(r.space_id)
    )
    or exists (
      select 1
      from public.spaces s
      where s.slug = split_part(storage.objects.name, '/', 1)
        and public.is_space_manager(s.id)
    )
  )
);
