-- Shared backend refactor infrastructure:
-- canonical content statuses, Shanghai-time helpers, soft-delete timestamps,
-- and one-time student content-change notifications.

create or replace function public.now_shanghai()
returns timestamptz
language sql
stable
as $$
  select timezone('Asia/Shanghai', now()) at time zone 'Asia/Shanghai';
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = public.now_shanghai();
  return new;
end;
$$;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'super_admin', 'teacher', 'student'));

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_admin_backoffice_access()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.status = 'active'
        and p.role in ('admin', 'super_admin')
    );
$$;

alter table public.profiles alter column created_at set default public.now_shanghai();
alter table public.profiles alter column updated_at set default public.now_shanghai();
alter table public.teacher_profiles alter column created_at set default public.now_shanghai();
alter table public.teacher_profiles alter column updated_at set default public.now_shanghai();
alter table public.student_profiles alter column created_at set default public.now_shanghai();
alter table public.student_profiles alter column updated_at set default public.now_shanghai();
alter table public.spaces alter column created_at set default public.now_shanghai();
alter table public.spaces alter column updated_at set default public.now_shanghai();
alter table public.space_memberships alter column joined_at set default public.now_shanghai();
alter table public.space_sections alter column created_at set default public.now_shanghai();
alter table public.space_sections alter column updated_at set default public.now_shanghai();
alter table public.resources alter column created_at set default public.now_shanghai();
alter table public.resources alter column updated_at set default public.now_shanghai();
alter table public.resource_files alter column created_at set default public.now_shanghai();
alter table public.notices alter column created_at set default public.now_shanghai();
alter table public.notices alter column updated_at set default public.now_shanghai();
alter table public.exercise_sets alter column created_at set default public.now_shanghai();
alter table public.exercise_sets alter column updated_at set default public.now_shanghai();
alter table public.exercise_items alter column created_at set default public.now_shanghai();
alter table public.exercise_items alter column updated_at set default public.now_shanghai();
alter table public.exercise_attempts alter column attempted_at set default public.now_shanghai();
alter table public.wrong_book_items alter column first_wrong_at set default public.now_shanghai();
alter table public.wrong_book_items alter column latest_wrong_at set default public.now_shanghai();
alter table public.wrong_book_items alter column created_at set default public.now_shanghai();
alter table public.wrong_book_items alter column updated_at set default public.now_shanghai();
alter table public.groups alter column created_at set default public.now_shanghai();
alter table public.groups alter column updated_at set default public.now_shanghai();
alter table public.group_members alter column joined_at set default public.now_shanghai();
alter table public.tasks alter column created_at set default public.now_shanghai();
alter table public.tasks alter column updated_at set default public.now_shanghai();
alter table public.task_submissions alter column created_at set default public.now_shanghai();
alter table public.task_submissions alter column updated_at set default public.now_shanghai();
alter table public.task_submission_files alter column created_at set default public.now_shanghai();

alter table public.spaces
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.space_sections
  add column if not exists status text not null default 'published',
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.resources
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.notices
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.exercise_sets
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.tasks
  add column if not exists deadline timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

update public.tasks
set deadline = due_at
where deadline is null
  and due_at is not null;

do $$
declare
  target_table text;
begin
  foreach target_table in array array['spaces', 'space_sections', 'resources', 'notices', 'exercise_sets', 'tasks']
  loop
    execute format(
      'alter table public.%I drop constraint if exists %I',
      target_table,
      target_table || '_status_check'
    );

    execute format(
      'alter table public.%I add constraint %I check (status in (''draft'', ''published'', ''archived'', ''deleted''))',
      target_table,
      target_table || '_status_check'
    );
  end loop;
end $$;

create index if not exists idx_spaces_status on public.spaces (status);
create index if not exists idx_spaces_archived_at on public.spaces (archived_at);
create index if not exists idx_space_sections_status on public.space_sections (space_id, status, sort_order);
create index if not exists idx_resources_status on public.resources (status);
create index if not exists idx_resources_publish_at on public.resources (published_at);
create index if not exists idx_resources_archived_at on public.resources (archived_at);
create index if not exists idx_notices_status on public.notices (status);
create index if not exists idx_notices_publish_expire on public.notices (publish_at, expire_at);
create index if not exists idx_notices_archived_at on public.notices (archived_at);
create index if not exists idx_exercise_sets_status on public.exercise_sets (space_id, status, updated_at desc);
create index if not exists idx_exercise_sets_archived_at on public.exercise_sets (archived_at);
create index if not exists idx_tasks_status on public.tasks (space_id, status, deadline);
create index if not exists idx_tasks_deadline on public.tasks (deadline);
create index if not exists idx_tasks_archived_at on public.tasks (archived_at);

create table if not exists public.content_change_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.spaces (id) on delete cascade,
  content_type text not null check (content_type in ('announcement', 'chapter', 'resource', 'assignment', 'practice_set', 'student_group')),
  content_id uuid not null,
  action_type text not null check (action_type in ('edited', 'archived', 'deleted')),
  message text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default public.now_shanghai()
);

create unique index if not exists idx_content_change_notifications_latest_unread
  on public.content_change_notifications (user_id, content_type, content_id)
  where is_read = false;

create index if not exists idx_content_change_notifications_user_unread
  on public.content_change_notifications (user_id, is_read, created_at desc);

create index if not exists idx_content_change_notifications_class_id
  on public.content_change_notifications (class_id, created_at desc);

create index if not exists idx_content_change_notifications_content
  on public.content_change_notifications (content_type, content_id);

alter table public.content_change_notifications enable row level security;

drop policy if exists "content_change_notifications_select_own" on public.content_change_notifications;
create policy "content_change_notifications_select_own"
on public.content_change_notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "content_change_notifications_update_own_read_state" on public.content_change_notifications;
create policy "content_change_notifications_update_own_read_state"
on public.content_change_notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.can_view_space(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_profile_is_active()
    and exists (
      select 1
      from public.spaces s
      where s.id = target_space_id
        and (
          public.is_super_admin()
          or (
            s.status not in ('archived', 'deleted')
            and (
              public.is_space_manager(target_space_id)
              or exists (
                select 1
                from public.profiles p
                join public.space_memberships sm
                  on sm.profile_id = p.id
                 and sm.space_id = target_space_id
                 and sm.status = 'active'
                where p.id = auth.uid()
                  and not (p.role = 'student' and p.user_type = 'external')
              )
            )
          )
        )
    );
$$;

create or replace function public.can_view_notice(target_notice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.notices n
    where n.id = target_notice_id
      and n.status <> 'deleted'
      and (
        public.is_space_manager(n.space_id)
        or (
          n.status = 'published'
          and public.can_view_space(n.space_id)
          and coalesce(n.publish_at, public.now_shanghai()) <= public.now_shanghai()
          and (n.expire_at is null or n.expire_at > public.now_shanghai())
        )
      )
  );
$$;

create or replace function public.can_view_resource(target_resource_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.resources r
    where r.id = target_resource_id
      and r.status <> 'deleted'
      and (
        public.is_space_manager(r.space_id)
        or (
          r.status = 'published'
          and public.can_view_space(r.space_id)
          and r.visibility in ('space', 'selected_members', 'public')
        )
      )
  );
$$;

create or replace function public.can_view_exercise_set(target_exercise_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.exercise_sets es
    where es.id = target_exercise_set_id
      and es.status <> 'deleted'
      and (
        public.is_space_manager(es.space_id)
        or (es.status = 'published' and public.can_view_space(es.space_id))
      )
  );
$$;

create or replace function public.can_view_task(target_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = target_task_id
      and t.status <> 'deleted'
      and (
        public.is_space_manager(t.space_id)
        or (t.status = 'published' and public.can_view_space(t.space_id))
      )
  );
$$;
