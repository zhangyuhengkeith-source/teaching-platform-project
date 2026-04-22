-- Shared scheduling and chapter binding for class teaching-content modules.

alter table public.resources
  add column if not exists chapter_id uuid references public.course_chapter_items (id) on delete set null,
  add column if not exists publish_at timestamptz;

update public.resources
set publish_at = published_at
where publish_at is null
  and published_at is not null;

alter table public.tasks
  add column if not exists chapter_id uuid references public.course_chapter_items (id) on delete set null,
  add column if not exists publish_at timestamptz;

alter table public.exercise_sets
  add column if not exists chapter_id uuid references public.course_chapter_items (id) on delete set null,
  add column if not exists publish_at timestamptz;

create index if not exists idx_resources_class_chapter_status_publish
  on public.resources (space_id, chapter_id, status, publish_at desc);

create index if not exists idx_tasks_class_chapter_status_publish
  on public.tasks (space_id, chapter_id, status, publish_at asc, deadline asc);

create index if not exists idx_exercise_sets_class_chapter_status_publish
  on public.exercise_sets (space_id, chapter_id, status, publish_at desc);

create index if not exists idx_resources_publish_at
  on public.resources (publish_at desc);

create index if not exists idx_tasks_publish_at
  on public.tasks (publish_at asc);

create index if not exists idx_exercise_sets_publish_at
  on public.exercise_sets (publish_at desc);
