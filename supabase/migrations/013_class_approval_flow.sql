-- Class creation approval flow for the teacher/admin homepage.

alter table public.spaces
  add column if not exists created_by uuid references public.profiles (id) on delete restrict,
  add column if not exists approval_status text not null default 'approved',
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles (id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references public.profiles (id) on delete set null,
  add column if not exists rejection_reason text;

update public.spaces
set created_by = owner_id
where created_by is null;

update public.spaces
set approval_status = 'approved',
    approved_at = coalesce(approved_at, created_at),
    approved_by = coalesce(approved_by, owner_id)
where approval_status is null;

alter table public.spaces drop constraint if exists spaces_approval_status_check;
alter table public.spaces
  add constraint spaces_approval_status_check check (approval_status in ('pending', 'approved', 'rejected'));

create index if not exists idx_spaces_type_approval_status on public.spaces (type, approval_status, updated_at desc);
create index if not exists idx_spaces_created_by on public.spaces (created_by);
create index if not exists idx_spaces_approval_status on public.spaces (approval_status);

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
            s.type = 'class'
            and s.approval_status in ('pending', 'rejected')
            and s.created_by = auth.uid()
          )
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
                  and (
                    s.type <> 'class'
                    or s.approval_status = 'approved'
                  )
              )
            )
          )
        )
    );
$$;
