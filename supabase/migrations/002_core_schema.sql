-- Core schema for Task 2:
-- identity, learning spaces, resources, files, and notices.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  display_name text,
  avatar_url text,
  role text not null check (role in ('super_admin', 'teacher', 'student')),
  user_type text not null check (user_type in ('internal', 'external')),
  grade_level text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  bio text,
  subjects text[] not null default '{}',
  is_founder boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  internal_student_code text,
  school_name text,
  notes_private text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('class', 'elective')),
  title text not null,
  slug text not null unique,
  description text,
  academic_year text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.space_memberships (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  membership_role text not null check (membership_role in ('student', 'teacher', 'assistant', 'group_leader')),
  status text not null default 'pending' check (status in ('active', 'pending', 'removed')),
  joined_at timestamptz not null default timezone('utc', now()),
  unique (space_id, profile_id)
);

create table if not exists public.space_sections (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null,
  slug text not null,
  type text not null check (type in ('chapter', 'module', 'week', 'topic_group')),
  sort_order integer not null default 0,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (space_id, slug)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  section_id uuid references public.space_sections (id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  resource_type text not null check (
    resource_type in (
      'ppt',
      'case_analysis',
      'revision',
      'extension',
      'worksheet',
      'model_answer',
      'mock_paper',
      'mark_scheme',
      'other'
    )
  ),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'space' check (visibility in ('space', 'selected_members', 'public')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete restrict,
  published_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (space_id, slug)
);

create table if not exists public.resource_files (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_ext text,
  mime_type text,
  file_size bigint,
  preview_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null,
  body text not null,
  notice_type text not null check (notice_type in ('homework', 'deadline', 'mock_exam', 'general', 'grouping', 'service_update')),
  publish_at timestamptz,
  expire_at timestamptz,
  is_pinned boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_user_type on public.profiles (user_type);
create index if not exists idx_space_memberships_profile_id on public.space_memberships (profile_id);
create index if not exists idx_space_memberships_space_id on public.space_memberships (space_id);
create index if not exists idx_space_sections_space_id on public.space_sections (space_id, sort_order);
create index if not exists idx_resources_space_id on public.resources (space_id, status, sort_order);
create index if not exists idx_resources_section_id on public.resources (section_id, sort_order);
create index if not exists idx_notices_space_id on public.notices (space_id, status, publish_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_teacher_profiles_updated_at on public.teacher_profiles;
create trigger set_teacher_profiles_updated_at
before update on public.teacher_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_student_profiles_updated_at on public.student_profiles;
create trigger set_student_profiles_updated_at
before update on public.student_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_spaces_updated_at on public.spaces;
create trigger set_spaces_updated_at
before update on public.spaces
for each row
execute function public.set_updated_at();

drop trigger if exists set_space_sections_updated_at on public.space_sections;
create trigger set_space_sections_updated_at
before update on public.space_sections
for each row
execute function public.set_updated_at();

drop trigger if exists set_resources_updated_at on public.resources;
create trigger set_resources_updated_at
before update on public.resources
for each row
execute function public.set_updated_at();

drop trigger if exists set_notices_updated_at on public.notices;
create trigger set_notices_updated_at
before update on public.notices
for each row
execute function public.set_updated_at();

