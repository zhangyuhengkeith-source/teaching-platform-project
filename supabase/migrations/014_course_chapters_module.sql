-- Course Chapters module:
-- class-bound chapter outlines, four-level directory items, and reusable templates.

create table if not exists public.course_chapter_sets (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.spaces (id) on delete cascade,
  main_title text not null,
  subtitle text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived', 'deleted')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete restrict,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default public.now_shanghai(),
  updated_at timestamptz not null default public.now_shanghai()
);

create table if not exists public.course_chapter_items (
  id uuid primary key default gen_random_uuid(),
  chapter_set_id uuid not null references public.course_chapter_sets (id) on delete cascade,
  parent_id uuid references public.course_chapter_items (id) on delete cascade,
  level integer not null check (level between 1 and 4),
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default public.now_shanghai(),
  updated_at timestamptz not null default public.now_shanghai()
);

create table if not exists public.course_chapter_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  visibility text not null default 'teachers' check (visibility in ('private', 'teachers')),
  source_class_id uuid references public.spaces (id) on delete set null,
  source_chapter_set_id uuid references public.course_chapter_sets (id) on delete set null,
  main_title text not null,
  subtitle text,
  items_json jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default public.now_shanghai(),
  updated_at timestamptz not null default public.now_shanghai(),
  constraint course_chapter_templates_items_array_check check (jsonb_typeof(items_json) = 'array')
);

create unique index if not exists idx_course_chapter_sets_class_main_title_unique
  on public.course_chapter_sets (class_id, lower(main_title))
  where status <> 'deleted';

create unique index if not exists idx_course_chapter_sets_class_subtitle_unique
  on public.course_chapter_sets (class_id, lower(subtitle))
  where status <> 'deleted'
    and subtitle is not null
    and btrim(subtitle) <> '';

create index if not exists idx_course_chapter_sets_class_status
  on public.course_chapter_sets (class_id, status, updated_at desc);

create index if not exists idx_course_chapter_sets_created_by
  on public.course_chapter_sets (created_by);

create index if not exists idx_course_chapter_items_set_parent_order
  on public.course_chapter_items (chapter_set_id, parent_id, sort_order);

create index if not exists idx_course_chapter_templates_visibility
  on public.course_chapter_templates (visibility, updated_at desc);

create index if not exists idx_course_chapter_templates_created_by
  on public.course_chapter_templates (created_by, updated_at desc);

drop trigger if exists set_course_chapter_sets_updated_at on public.course_chapter_sets;
create trigger set_course_chapter_sets_updated_at
before update on public.course_chapter_sets
for each row
execute function public.set_updated_at();

drop trigger if exists set_course_chapter_items_updated_at on public.course_chapter_items;
create trigger set_course_chapter_items_updated_at
before update on public.course_chapter_items
for each row
execute function public.set_updated_at();

drop trigger if exists set_course_chapter_templates_updated_at on public.course_chapter_templates;
create trigger set_course_chapter_templates_updated_at
before update on public.course_chapter_templates
for each row
execute function public.set_updated_at();

create or replace function public.can_view_course_chapter_set(target_chapter_set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.course_chapter_sets ccs
    where ccs.id = target_chapter_set_id
      and ccs.status <> 'deleted'
      and public.can_view_space(ccs.class_id)
  );
$$;

create or replace function public.can_view_course_chapter_template(target_template_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_profile_is_active()
    and exists (
      select 1
      from public.course_chapter_templates cct
      where cct.id = target_template_id
        and (
          public.is_super_admin()
          or cct.created_by = auth.uid()
          or (cct.visibility = 'teachers' and public.is_teacher())
        )
    );
$$;

alter table public.course_chapter_sets enable row level security;
alter table public.course_chapter_items enable row level security;
alter table public.course_chapter_templates enable row level security;

drop policy if exists "course_chapter_sets_select" on public.course_chapter_sets;
create policy "course_chapter_sets_select"
on public.course_chapter_sets
for select
to authenticated
using (public.can_view_course_chapter_set(id));

drop policy if exists "course_chapter_sets_write" on public.course_chapter_sets;
create policy "course_chapter_sets_write"
on public.course_chapter_sets
for all
to authenticated
using (public.is_space_manager(class_id))
with check (public.is_space_manager(class_id));

drop policy if exists "course_chapter_items_select" on public.course_chapter_items;
create policy "course_chapter_items_select"
on public.course_chapter_items
for select
to authenticated
using (public.can_view_course_chapter_set(chapter_set_id));

drop policy if exists "course_chapter_items_write" on public.course_chapter_items;
create policy "course_chapter_items_write"
on public.course_chapter_items
for all
to authenticated
using (
  exists (
    select 1
    from public.course_chapter_sets ccs
    where ccs.id = chapter_set_id
      and public.is_space_manager(ccs.class_id)
  )
)
with check (
  exists (
    select 1
    from public.course_chapter_sets ccs
    where ccs.id = chapter_set_id
      and public.is_space_manager(ccs.class_id)
  )
);

drop policy if exists "course_chapter_templates_select" on public.course_chapter_templates;
create policy "course_chapter_templates_select"
on public.course_chapter_templates
for select
to authenticated
using (public.can_view_course_chapter_template(id));

drop policy if exists "course_chapter_templates_insert" on public.course_chapter_templates;
create policy "course_chapter_templates_insert"
on public.course_chapter_templates
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_teacher()
);

drop policy if exists "course_chapter_templates_update" on public.course_chapter_templates;
create policy "course_chapter_templates_update"
on public.course_chapter_templates
for update
to authenticated
using (created_by = auth.uid() or public.is_super_admin())
with check (created_by = auth.uid() or public.is_super_admin());

drop policy if exists "course_chapter_templates_delete" on public.course_chapter_templates;
create policy "course_chapter_templates_delete"
on public.course_chapter_templates
for delete
to authenticated
using (created_by = auth.uid() or public.is_super_admin());
