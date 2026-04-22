-- Class Student Groups module:
-- class grouping rules, class-wide active membership uniqueness, and soft delete support.

alter table public.groups
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.groups drop constraint if exists groups_status_check;
alter table public.groups
  add constraint groups_status_check check (status in ('forming', 'active', 'locked', 'archived', 'deleted'));

alter table public.group_members
  add column if not exists space_id uuid references public.spaces (id) on delete cascade;

update public.group_members gm
set space_id = g.space_id
from public.groups g
where gm.group_id = g.id
  and gm.space_id is null;

create or replace function public.set_group_member_space_id()
returns trigger
language plpgsql
as $$
begin
  select g.space_id
    into new.space_id
  from public.groups g
  where g.id = new.group_id;

  if new.space_id is null then
    raise exception 'Group member must reference an existing group.';
  end if;

  return new;
end;
$$;

drop trigger if exists set_group_members_space_id on public.group_members;
create trigger set_group_members_space_id
before insert or update of group_id
on public.group_members
for each row
execute function public.set_group_member_space_id();

create unique index if not exists idx_group_members_one_active_group_per_space
  on public.group_members (space_id, profile_id)
  where status = 'active';

create index if not exists idx_group_members_space_status
  on public.group_members (space_id, status);

create table if not exists public.class_grouping_rules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.spaces (id) on delete cascade,
  max_students_per_group integer not null check (max_students_per_group between 1 and 30),
  instructions text,
  deadline timestamptz not null,
  auto_group_status text not null default 'pending' check (auto_group_status in ('pending', 'completed')),
  auto_grouped_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default public.now_shanghai(),
  updated_at timestamptz not null default public.now_shanghai()
);

create index if not exists idx_class_grouping_rules_class_status_deadline
  on public.class_grouping_rules (class_id, auto_group_status, deadline desc);

drop trigger if exists set_class_grouping_rules_updated_at on public.class_grouping_rules;
create trigger set_class_grouping_rules_updated_at
before update on public.class_grouping_rules
for each row
execute function public.set_updated_at();

alter table public.class_grouping_rules enable row level security;

drop policy if exists "class_grouping_rules_select" on public.class_grouping_rules;
create policy "class_grouping_rules_select"
on public.class_grouping_rules
for select
to authenticated
using (public.can_view_space(class_id));

drop policy if exists "class_grouping_rules_write" on public.class_grouping_rules;
create policy "class_grouping_rules_write"
on public.class_grouping_rules
for all
to authenticated
using (public.is_space_manager(class_id))
with check (public.is_space_manager(class_id));
