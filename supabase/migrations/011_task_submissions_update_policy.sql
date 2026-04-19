-- Allow students and group leaders to transition editable submissions into
-- submitted state without keeping the row editable after submission.

drop policy if exists "task_submissions_update" on public.task_submissions;
create policy "task_submissions_update"
on public.task_submissions
for update
to authenticated
using (public.can_edit_submission(id))
with check (public.can_create_submission(task_id, submitter_profile_id, submitter_group_id));
