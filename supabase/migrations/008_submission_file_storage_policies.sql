-- Provision protected storage for task submission attachments.

insert into storage.buckets (id, name, public, file_size_limit)
values ('submission-files', 'submission-files', false, 26214400)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "submission_files_storage_select" on storage.objects;
create policy "submission_files_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'submission-files'
  and exists (
    select 1
    from public.task_submission_files tsf
    where tsf.file_path = storage.objects.bucket_id || '/' || storage.objects.name
      and public.can_view_submission(tsf.submission_id)
  )
);

drop policy if exists "submission_files_storage_insert" on storage.objects;
create policy "submission_files_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'submission-files'
  and exists (
    select 1
    from public.tasks t
    join public.spaces s
      on s.id = t.space_id
    where s.slug = split_part(storage.objects.name, '/', 1)
      and t.slug = split_part(storage.objects.name, '/', 2)
      and (
        public.is_space_manager(s.id)
        or (
          t.submission_mode = 'individual'
          and public.is_internal_student()
          and public.can_view_space(s.id)
        )
        or (
          t.submission_mode = 'group'
          and public.can_view_space(s.id)
          and exists (
            select 1
            from public.groups g
            join public.group_members gm
              on gm.group_id = g.id
             and gm.profile_id = auth.uid()
             and gm.status = 'active'
             and gm.member_role = 'leader'
            where g.space_id = s.id
              and g.status in ('forming', 'active', 'locked')
          )
        )
      )
  )
);

drop policy if exists "submission_files_storage_delete" on storage.objects;
create policy "submission_files_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'submission-files'
  and (
    exists (
      select 1
      from public.task_submission_files tsf
      where tsf.file_path = storage.objects.bucket_id || '/' || storage.objects.name
        and public.can_edit_submission(tsf.submission_id)
    )
    or exists (
      select 1
      from public.tasks t
      join public.spaces s
        on s.id = t.space_id
      where s.slug = split_part(storage.objects.name, '/', 1)
        and t.slug = split_part(storage.objects.name, '/', 2)
        and (
          public.is_space_manager(s.id)
          or (
            t.submission_mode = 'individual'
            and public.is_internal_student()
            and public.can_view_space(s.id)
          )
          or (
            t.submission_mode = 'group'
            and public.can_view_space(s.id)
            and exists (
              select 1
              from public.groups g
              join public.group_members gm
                on gm.group_id = g.id
               and gm.profile_id = auth.uid()
               and gm.status = 'active'
               and gm.member_role = 'leader'
              where g.space_id = s.id
                and g.status in ('forming', 'active', 'locked')
            )
          )
        )
    )
  )
);
