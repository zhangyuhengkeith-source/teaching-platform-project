-- Allow submission attachment metadata to be updated and removed when the submission is editable.

drop policy if exists "task_submission_files_update" on public.task_submission_files;
create policy "task_submission_files_update"
on public.task_submission_files
for update
to authenticated
using (
  exists (
    select 1
    from public.task_submissions ts
    where ts.id = submission_id
      and public.can_edit_submission(ts.id)
  )
)
with check (
  exists (
    select 1
    from public.task_submissions ts
    where ts.id = submission_id
      and public.can_edit_submission(ts.id)
  )
);

drop policy if exists "task_submission_files_delete" on public.task_submission_files;
create policy "task_submission_files_delete"
on public.task_submission_files
for delete
to authenticated
using (
  exists (
    select 1
    from public.task_submissions ts
    where ts.id = submission_id
      and public.can_edit_submission(ts.id)
  )
);
