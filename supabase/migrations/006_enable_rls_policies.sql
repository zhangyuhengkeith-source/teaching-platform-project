-- Enable row level security and add baseline policies for the teaching platform.
-- This turns the earlier RLS plan into executable policies that match the current app flows.

create or replace function public.current_profile_is_active()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
  );
$$;

create or replace function public.has_admin_backoffice_access()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and lower(p.email) = 'zhangyuheng_andy@163.com'
  );
$$;

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
        and p.role = 'super_admin'
    );
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.status = 'active'
        and p.role = 'teacher'
    );
$$;

create or replace function public.is_internal_student()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and p.role = 'student'
      and p.user_type = 'internal'
  );
$$;

create or replace function public.is_space_manager(target_space_id uuid)
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
      left join public.space_memberships sm
        on sm.space_id = s.id
       and sm.profile_id = auth.uid()
       and sm.status = 'active'
       and sm.membership_role in ('teacher', 'assistant')
      where s.id = target_space_id
        and (
          public.is_super_admin()
          or s.owner_id = auth.uid()
          or sm.id is not null
        )
    );
$$;

create or replace function public.can_view_space(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_profile_is_active()
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
    );
$$;

create or replace function public.can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_profile_is_active()
    and (
      target_profile_id = auth.uid()
      or public.is_super_admin()
      or exists (
        select 1
        from public.space_memberships target_sm
        where target_sm.profile_id = target_profile_id
          and target_sm.status = 'active'
          and (
            public.is_space_manager(target_sm.space_id)
            or exists (
              select 1
              from public.space_memberships my_sm
              where my_sm.space_id = target_sm.space_id
                and my_sm.profile_id = auth.uid()
                and my_sm.status = 'active'
            )
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
      and (
        public.is_space_manager(n.space_id)
        or (
          n.status = 'published'
          and public.can_view_space(n.space_id)
          and coalesce(n.publish_at, timezone('utc', now())) <= timezone('utc', now())
          and (n.expire_at is null or n.expire_at > timezone('utc', now()))
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
      and (
        public.is_space_manager(es.space_id)
        or (es.status = 'published' and public.can_view_space(es.space_id))
      )
  );
$$;

create or replace function public.can_create_group(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.spaces s
    where s.id = target_space_id
      and s.type = 'elective'
      and (
        public.is_space_manager(s.id)
        or (
          public.is_internal_student()
          and public.can_view_space(s.id)
          and not s.grouping_locked
        )
      )
  );
$$;

create or replace function public.can_view_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = target_group_id
      and (
        public.is_space_manager(g.space_id)
        or (
          public.can_view_space(g.space_id)
          and (
            g.status = 'forming'
            or exists (
              select 1
              from public.group_members gm
              where gm.group_id = g.id
                and gm.profile_id = auth.uid()
                and gm.status = 'active'
            )
          )
        )
      )
  );
$$;

create or replace function public.can_join_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = target_group_id
      and g.status in ('forming', 'active')
      and public.can_create_group(g.space_id)
  );
$$;

create or replace function public.can_edit_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.groups g
    join public.spaces s on s.id = g.space_id
    where g.id = target_group_id
      and (
        public.is_space_manager(g.space_id)
        or (
          g.leader_profile_id = auth.uid()
          and not s.grouping_locked
        )
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
      and (
        public.is_space_manager(t.space_id)
        or (t.status = 'published' and public.can_view_space(t.space_id))
      )
  );
$$;

create or replace function public.can_create_submission(target_task_id uuid, target_profile_id uuid, target_group_id uuid)
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
      and public.can_view_task(t.id)
      and (
        public.is_space_manager(t.space_id)
        or (
          t.submission_mode = 'individual'
          and target_profile_id = auth.uid()
          and target_group_id is null
        )
        or (
          t.submission_mode = 'group'
          and target_profile_id is null
          and target_group_id is not null
          and exists (
            select 1
            from public.groups g
            join public.group_members gm
              on gm.group_id = g.id
             and gm.profile_id = auth.uid()
             and gm.status = 'active'
             and gm.member_role = 'leader'
            where g.id = target_group_id
              and g.space_id = t.space_id
          )
        )
      )
  );
$$;

create or replace function public.can_view_submission(target_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.task_submissions ts
    join public.tasks t on t.id = ts.task_id
    where ts.id = target_submission_id
      and (
        public.is_space_manager(t.space_id)
        or ts.submitter_profile_id = auth.uid()
        or exists (
          select 1
          from public.group_members gm
          where gm.group_id = ts.submitter_group_id
            and gm.profile_id = auth.uid()
            and gm.status = 'active'
        )
      )
  );
$$;

create or replace function public.can_edit_submission(target_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.task_submissions ts
    join public.tasks t on t.id = ts.task_id
    where ts.id = target_submission_id
      and (
        public.is_space_manager(t.space_id)
        or (
          t.submission_mode = 'individual'
          and ts.submitter_profile_id = auth.uid()
          and ts.status in ('draft', 'returned', 'overdue')
        )
        or (
          t.submission_mode = 'group'
          and ts.status in ('draft', 'returned', 'overdue')
          and exists (
            select 1
            from public.group_members gm
            where gm.group_id = ts.submitter_group_id
              and gm.profile_id = auth.uid()
              and gm.status = 'active'
              and gm.member_role = 'leader'
          )
        )
      )
  );
$$;

alter table public.profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_memberships enable row level security;
alter table public.space_sections enable row level security;
alter table public.resources enable row level security;
alter table public.resource_files enable row level security;
alter table public.notices enable row level security;
alter table public.exercise_sets enable row level security;
alter table public.exercise_items enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.wrong_book_items enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.task_submission_files enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles
for select
to authenticated
using (public.can_view_profile(id));

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_super_admin())
with check (id = auth.uid() or public.is_super_admin());

drop policy if exists "teacher_profiles_select" on public.teacher_profiles;
create policy "teacher_profiles_select"
on public.teacher_profiles
for select
to authenticated
using (public.can_view_profile(profile_id));

drop policy if exists "teacher_profiles_write" on public.teacher_profiles;
create policy "teacher_profiles_write"
on public.teacher_profiles
for all
to authenticated
using (profile_id = auth.uid() or public.is_teacher())
with check (profile_id = auth.uid() or public.is_teacher());

drop policy if exists "student_profiles_select" on public.student_profiles;
create policy "student_profiles_select"
on public.student_profiles
for select
to authenticated
using (public.can_view_profile(profile_id));

drop policy if exists "student_profiles_write" on public.student_profiles;
create policy "student_profiles_write"
on public.student_profiles
for all
to authenticated
using (profile_id = auth.uid() or public.is_teacher())
with check (profile_id = auth.uid() or public.is_teacher());

drop policy if exists "spaces_select" on public.spaces;
create policy "spaces_select"
on public.spaces
for select
to authenticated
using (public.can_view_space(id));

drop policy if exists "spaces_insert" on public.spaces;
create policy "spaces_insert"
on public.spaces
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.current_profile_is_active()
  and public.is_teacher()
);

drop policy if exists "spaces_update" on public.spaces;
create policy "spaces_update"
on public.spaces
for update
to authenticated
using (public.is_space_manager(id))
with check (public.is_space_manager(id));

drop policy if exists "space_memberships_select" on public.space_memberships;
create policy "space_memberships_select"
on public.space_memberships
for select
to authenticated
using (profile_id = auth.uid() or public.can_view_space(space_id));

drop policy if exists "space_memberships_write" on public.space_memberships;
create policy "space_memberships_write"
on public.space_memberships
for all
to authenticated
using (public.is_space_manager(space_id))
with check (public.is_space_manager(space_id));

drop policy if exists "space_sections_select" on public.space_sections;
create policy "space_sections_select"
on public.space_sections
for select
to authenticated
using (public.can_view_space(space_id));

drop policy if exists "space_sections_write" on public.space_sections;
create policy "space_sections_write"
on public.space_sections
for all
to authenticated
using (public.is_space_manager(space_id))
with check (public.is_space_manager(space_id));

drop policy if exists "resources_select" on public.resources;
create policy "resources_select"
on public.resources
for select
to authenticated
using (public.can_view_resource(id));

drop policy if exists "resources_write" on public.resources;
create policy "resources_write"
on public.resources
for all
to authenticated
using (public.is_space_manager(space_id))
with check (public.is_space_manager(space_id));

drop policy if exists "resource_files_select" on public.resource_files;
create policy "resource_files_select"
on public.resource_files
for select
to authenticated
using (
  exists (
    select 1
    from public.resources r
    where r.id = resource_id
      and public.can_view_resource(r.id)
  )
);

drop policy if exists "resource_files_write" on public.resource_files;
create policy "resource_files_write"
on public.resource_files
for all
to authenticated
using (
  exists (
    select 1
    from public.resources r
    where r.id = resource_id
      and public.is_space_manager(r.space_id)
  )
)
with check (
  exists (
    select 1
    from public.resources r
    where r.id = resource_id
      and public.is_space_manager(r.space_id)
  )
);

drop policy if exists "notices_select" on public.notices;
create policy "notices_select"
on public.notices
for select
to authenticated
using (public.can_view_notice(id));

drop policy if exists "notices_write" on public.notices;
create policy "notices_write"
on public.notices
for all
to authenticated
using (public.is_space_manager(space_id))
with check (public.is_space_manager(space_id));

drop policy if exists "exercise_sets_select" on public.exercise_sets;
create policy "exercise_sets_select"
on public.exercise_sets
for select
to authenticated
using (public.can_view_exercise_set(id));

drop policy if exists "exercise_sets_write" on public.exercise_sets;
create policy "exercise_sets_write"
on public.exercise_sets
for all
to authenticated
using (public.is_space_manager(space_id))
with check (public.is_space_manager(space_id));

drop policy if exists "exercise_items_select" on public.exercise_items;
create policy "exercise_items_select"
on public.exercise_items
for select
to authenticated
using (public.can_view_exercise_set(exercise_set_id));

drop policy if exists "exercise_items_write" on public.exercise_items;
create policy "exercise_items_write"
on public.exercise_items
for all
to authenticated
using (
  exists (
    select 1
    from public.exercise_sets es
    where es.id = exercise_set_id
      and public.is_space_manager(es.space_id)
  )
)
with check (
  exists (
    select 1
    from public.exercise_sets es
    where es.id = exercise_set_id
      and public.is_space_manager(es.space_id)
  )
);

drop policy if exists "exercise_attempts_select" on public.exercise_attempts;
create policy "exercise_attempts_select"
on public.exercise_attempts
for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.exercise_sets es
    where es.id = exercise_set_id
      and public.is_space_manager(es.space_id)
  )
);

drop policy if exists "exercise_attempts_insert" on public.exercise_attempts;
create policy "exercise_attempts_insert"
on public.exercise_attempts
for insert
to authenticated
with check (
  (
    profile_id = auth.uid()
    and public.can_view_exercise_set(exercise_set_id)
  )
  or exists (
    select 1
    from public.exercise_sets es
    where es.id = exercise_set_id
      and public.is_space_manager(es.space_id)
  )
);

drop policy if exists "wrong_book_items_select" on public.wrong_book_items;
create policy "wrong_book_items_select"
on public.wrong_book_items
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "wrong_book_items_write" on public.wrong_book_items;
create policy "wrong_book_items_write"
on public.wrong_book_items
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "groups_select" on public.groups;
create policy "groups_select"
on public.groups
for select
to authenticated
using (public.can_view_group(id));

drop policy if exists "groups_insert" on public.groups;
create policy "groups_insert"
on public.groups
for insert
to authenticated
with check (
  leader_profile_id = auth.uid()
  and public.can_create_group(space_id)
);

drop policy if exists "groups_update" on public.groups;
create policy "groups_update"
on public.groups
for update
to authenticated
using (public.can_edit_group(id))
with check (public.can_edit_group(id));

drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select"
on public.group_members
for select
to authenticated
using (profile_id = auth.uid() or public.can_view_group(group_id));

drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert"
on public.group_members
for insert
to authenticated
with check (
  (
    profile_id = auth.uid()
    and (public.can_join_group(group_id) or public.can_edit_group(group_id))
  )
  or public.can_edit_group(group_id)
);

drop policy if exists "group_members_update" on public.group_members;
create policy "group_members_update"
on public.group_members
for update
to authenticated
using (profile_id = auth.uid() or public.can_edit_group(group_id))
with check (profile_id = auth.uid() or public.can_edit_group(group_id));

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select"
on public.tasks
for select
to authenticated
using (public.can_view_task(id));

drop policy if exists "tasks_write" on public.tasks;
create policy "tasks_write"
on public.tasks
for all
to authenticated
using (public.is_space_manager(space_id))
with check (public.is_space_manager(space_id));

drop policy if exists "task_submissions_select" on public.task_submissions;
create policy "task_submissions_select"
on public.task_submissions
for select
to authenticated
using (public.can_view_submission(id));

drop policy if exists "task_submissions_insert" on public.task_submissions;
create policy "task_submissions_insert"
on public.task_submissions
for insert
to authenticated
with check (public.can_create_submission(task_id, submitter_profile_id, submitter_group_id));

drop policy if exists "task_submissions_update" on public.task_submissions;
create policy "task_submissions_update"
on public.task_submissions
for update
to authenticated
using (public.can_edit_submission(id))
with check (public.can_edit_submission(id));

drop policy if exists "task_submission_files_select" on public.task_submission_files;
create policy "task_submission_files_select"
on public.task_submission_files
for select
to authenticated
using (
  exists (
    select 1
    from public.task_submissions ts
    where ts.id = submission_id
      and public.can_view_submission(ts.id)
  )
);

drop policy if exists "task_submission_files_insert" on public.task_submission_files;
create policy "task_submission_files_insert"
on public.task_submission_files
for insert
to authenticated
with check (
  exists (
    select 1
    from public.task_submissions ts
    where ts.id = submission_id
      and public.can_edit_submission(ts.id)
  )
);
