create table if not exists public.class_update_requests (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.spaces (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  proposed_title text not null,
  proposed_slug text not null,
  proposed_description text,
  proposed_academic_year text,
  proposed_status text not null check (proposed_status in ('draft', 'published', 'archived', 'deleted')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default public.now_shanghai(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  rejection_reason text,
  created_at timestamptz not null default public.now_shanghai(),
  updated_at timestamptz not null default public.now_shanghai()
);

create unique index if not exists idx_class_update_requests_one_pending
  on public.class_update_requests (class_id)
  where status = 'pending';

create index if not exists idx_class_update_requests_class_status
  on public.class_update_requests (class_id, status, submitted_at desc);

create index if not exists idx_class_update_requests_requested_by
  on public.class_update_requests (requested_by, submitted_at desc);

drop trigger if exists class_update_requests_set_updated_at on public.class_update_requests;
create trigger class_update_requests_set_updated_at
before update on public.class_update_requests
for each row execute function public.set_updated_at();

alter table public.class_update_requests enable row level security;

drop policy if exists "class_update_requests_select_relevant" on public.class_update_requests;
create policy "class_update_requests_select_relevant"
on public.class_update_requests
for select
to authenticated
using (
  requested_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
      and p.status = 'active'
  )
);

alter table public.content_change_notifications
  drop constraint if exists content_change_notifications_content_type_check;

alter table public.content_change_notifications
  add constraint content_change_notifications_content_type_check
  check (content_type in ('class', 'announcement', 'chapter', 'resource', 'assignment', 'practice_set', 'student_group'));
