create table if not exists public.calendar_settings (
  id smallint primary key default 1 check (id = 1),
  test_mode boolean not null default false,
  test_day integer not null default 1 check (test_day between 1 and 24),
  updated_at timestamptz not null default now()
);

insert into public.calendar_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.calendar_settings enable row level security;

grant select, update on public.calendar_settings to authenticated;

create policy "Authenticated users can read calendar settings"
  on public.calendar_settings
  for select
  to authenticated
  using (true);

create policy "Admins can update calendar settings"
  on public.calendar_settings
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role = 'admin'
    )
  );

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'calendar_settings'
  ) then
    alter publication supabase_realtime
      add table public.calendar_settings;
  end if;
end
$$;
