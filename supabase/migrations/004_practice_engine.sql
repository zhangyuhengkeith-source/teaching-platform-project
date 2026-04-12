-- Task 5 practice engine schema:
-- exercise sets, exercise items, attempts, and wrong-book tracking.

create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  section_id uuid references public.space_sections (id) on delete set null,
  title text not null,
  slug text not null,
  exercise_type text not null check (exercise_type in ('term_recall', 'flashcard', 'mcq')),
  instructions text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (space_id, slug)
);

create table if not exists public.exercise_items (
  id uuid primary key default gen_random_uuid(),
  exercise_set_id uuid not null references public.exercise_sets (id) on delete cascade,
  prompt text not null,
  prompt_rich text,
  item_type text not null check (item_type in ('mcq', 'flashcard', 'spelling')),
  answer_key_json jsonb not null,
  explanation text,
  sort_order integer not null default 0,
  difficulty text,
  tags_json jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  exercise_set_id uuid not null references public.exercise_sets (id) on delete cascade,
  item_id uuid not null references public.exercise_items (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  submitted_answer_json jsonb not null,
  is_correct boolean,
  score numeric(5,2),
  attempt_no integer not null default 1,
  attempted_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wrong_book_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  source_type text not null check (source_type in ('exercise_item')),
  source_id uuid not null references public.exercise_items (id) on delete cascade,
  latest_attempt_id uuid not null references public.exercise_attempts (id) on delete cascade,
  first_wrong_at timestamptz not null default timezone('utc', now()),
  latest_wrong_at timestamptz not null default timezone('utc', now()),
  mastered_at timestamptz,
  status text not null default 'active' check (status in ('active', 'mastered')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, source_type, source_id)
);

create index if not exists idx_exercise_sets_space_id on public.exercise_sets (space_id, status, updated_at desc);
create index if not exists idx_exercise_sets_section_id on public.exercise_sets (section_id, status, updated_at desc);
create index if not exists idx_exercise_items_exercise_set_id on public.exercise_items (exercise_set_id, sort_order);
create index if not exists idx_exercise_attempts_profile_id on public.exercise_attempts (profile_id, attempted_at desc);
create index if not exists idx_exercise_attempts_exercise_set_id on public.exercise_attempts (exercise_set_id, attempted_at desc);
create index if not exists idx_exercise_attempts_item_profile on public.exercise_attempts (item_id, profile_id, attempt_no desc);
create index if not exists idx_wrong_book_items_profile_id on public.wrong_book_items (profile_id, latest_wrong_at desc);
create index if not exists idx_wrong_book_items_active on public.wrong_book_items (profile_id, status, latest_wrong_at desc);

drop trigger if exists set_exercise_sets_updated_at on public.exercise_sets;
create trigger set_exercise_sets_updated_at
before update on public.exercise_sets
for each row
execute function public.set_updated_at();

drop trigger if exists set_exercise_items_updated_at on public.exercise_items;
create trigger set_exercise_items_updated_at
before update on public.exercise_items
for each row
execute function public.set_updated_at();

drop trigger if exists set_wrong_book_items_updated_at on public.wrong_book_items;
create trigger set_wrong_book_items_updated_at
before update on public.wrong_book_items
for each row
execute function public.set_updated_at();
