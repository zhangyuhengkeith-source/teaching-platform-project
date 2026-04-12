-- Task 6 elective groups, tasks, and submission workflow.

alter table public.spaces
  add column if not exists grouping_locked boolean not null default false,
  add column if not exists max_group_size integer not null default 4;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null,
  slug text not null,
  leader_profile_id uuid not null references public.profiles (id) on delete restrict,
  project_title text,
  project_summary text,
  status text not null default 'forming' check (status in ('forming', 'active', 'locked', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (space_id, slug)
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  member_role text not null check (member_role in ('leader', 'member')),
  joined_at timestamptz not null default timezone('utc', now()),
  status text not null default 'active' check (status in ('active', 'pending', 'removed')),
  unique (group_id, profile_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null,
  slug text not null,
  brief text,
  body text,
  submission_mode text not null check (submission_mode in ('individual', 'group')),
  due_at timestamptz,
  allow_resubmission boolean not null default true,
  template_resource_id uuid references public.resources (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (space_id, slug)
);

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  submitter_profile_id uuid references public.profiles (id) on delete cascade,
  submitter_group_id uuid references public.groups (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'overdue', 'returned', 'resubmitted', 'completed')),
  submitted_at timestamptz,
  content_json jsonb,
  text_content text,
  feedback_text text,
  feedback_score numeric(6,2),
  feedback_by uuid references public.profiles (id) on delete set null,
  feedback_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (
      submitter_profile_id is not null
      and submitter_group_id is null
    ) or (
      submitter_profile_id is null
      and submitter_group_id is not null
    )
  )
);

create table if not exists public.task_submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.task_submissions (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_task_submissions_task_profile_unique
  on public.task_submissions (task_id, submitter_profile_id)
  where submitter_profile_id is not null;

create unique index if not exists idx_task_submissions_task_group_unique
  on public.task_submissions (task_id, submitter_group_id)
  where submitter_group_id is not null;

create index if not exists idx_groups_space_id on public.groups (space_id, status, updated_at desc);
create index if not exists idx_group_members_group_id on public.group_members (group_id, status);
create index if not exists idx_group_members_profile_id on public.group_members (profile_id, status);
create index if not exists idx_tasks_space_id on public.tasks (space_id, status, due_at);
create index if not exists idx_task_submissions_task_id on public.task_submissions (task_id, status, submitted_at desc);
create index if not exists idx_task_submissions_group_id on public.task_submissions (submitter_group_id, status, submitted_at desc);
create index if not exists idx_task_submissions_profile_id on public.task_submissions (submitter_profile_id, status, submitted_at desc);

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row
execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists set_task_submissions_updated_at on public.task_submissions;
create trigger set_task_submissions_updated_at
before update on public.task_submissions
for each row
execute function public.set_updated_at();
