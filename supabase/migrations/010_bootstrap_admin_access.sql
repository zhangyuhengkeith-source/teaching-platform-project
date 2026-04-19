-- Move bootstrap admin access out of hardcoded policy literals.
-- Formal long-term admin authorization should converge on profiles.role = 'super_admin'.

create table if not exists public.bootstrap_admin_emails (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.bootstrap_admin_emails (email)
values ('zhangyuheng_andy@163.com')
on conflict (email) do nothing;

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
      and exists (
        select 1
        from public.bootstrap_admin_emails bae
        where lower(bae.email) = lower(p.email)
      )
  );
$$;
