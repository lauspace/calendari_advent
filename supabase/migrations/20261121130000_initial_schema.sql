create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  role text not null default 'participant'
    check (role in ('participant', 'admin')),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  day integer not null check (day between 1 and 24),
  title text not null default '',
  description text not null default '',
  title_es text,
  description_es text,
  title_ca text,
  description_ca text,
  duration_minutes integer not null default 10
    check (duration_minutes > 0),
  requires_text boolean not null default true,
  allows_photo boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'prepared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_assignments (
  mission_id uuid not null references public.missions (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mission_id, participant_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  response_text text,
  photo_path text,
  submitted_at timestamptz not null default now(),
  unique (mission_id, participant_id),
  check (
    nullif(btrim(response_text), '') is not null
    or photo_path is not null
  )
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique
    references public.submissions (id) on delete cascade,
  stars integer not null check (stars between 1 and 3),
  comment text,
  evaluated_by uuid references public.profiles (id) on delete set null,
  evaluated_at timestamptz not null default now()
);

create table if not exists public.calendar_settings (
  id smallint primary key default 1 check (id = 1),
  test_mode boolean not null default false,
  test_day integer not null default 1 check (test_day between 1 and 24),
  updated_at timestamptz not null default now()
);

insert into public.calendar_settings (id)
values (1)
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.mission_assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.evaluations enable row level security;
alter table public.calendar_settings enable row level security;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.missions to authenticated;
grant select, insert, delete on public.mission_assignments to authenticated;
grant select, insert, update, delete on public.submissions to authenticated;
grant select, insert, update, delete on public.evaluations to authenticated;
grant select, update on public.calendar_settings to authenticated;

create policy "Authenticated users can read profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Admins can read all missions and participants can read prepared missions"
  on public.missions
  for select
  to authenticated
  using (status = 'prepared' or (select public.is_admin()));

create policy "Admins can insert missions"
  on public.missions
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update missions"
  on public.missions
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete missions"
  on public.missions
  for delete
  to authenticated
  using ((select public.is_admin()));

create policy "Authenticated users can read mission assignments"
  on public.mission_assignments
  for select
  to authenticated
  using (true);

create policy "Admins can assign missions"
  on public.mission_assignments
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can remove mission assignments"
  on public.mission_assignments
  for delete
  to authenticated
  using ((select public.is_admin()));

create policy "Participants and admins can read submissions"
  on public.submissions
  for select
  to authenticated
  using (
    participant_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "Participants can submit assigned prepared missions"
  on public.submissions
  for insert
  to authenticated
  with check (
    participant_id = (select auth.uid())
    and exists (
      select 1
      from public.missions m
      where m.id = mission_id
        and m.status = 'prepared'
        and (
          not exists (
            select 1
            from public.mission_assignments ma
            where ma.mission_id = m.id
          )
          or exists (
            select 1
            from public.mission_assignments ma
            where ma.mission_id = m.id
              and ma.participant_id = (select auth.uid())
          )
        )
    )
  );

create policy "Participants can update their submissions and admins can update any"
  on public.submissions
  for update
  to authenticated
  using (
    participant_id = (select auth.uid())
    or (select public.is_admin())
  )
  with check (
    (
      participant_id = (select auth.uid())
      and exists (
        select 1
        from public.missions m
        where m.id = mission_id
          and m.status = 'prepared'
          and (
            not exists (
              select 1
              from public.mission_assignments ma
              where ma.mission_id = m.id
            )
            or exists (
              select 1
              from public.mission_assignments ma
              where ma.mission_id = m.id
                and ma.participant_id = (select auth.uid())
            )
          )
      )
    )
    or (select public.is_admin())
  );

create policy "Admins can delete submissions"
  on public.submissions
  for delete
  to authenticated
  using ((select public.is_admin()));

create policy "Participants can read their evaluations and admins can read all"
  on public.evaluations
  for select
  to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.submissions s
      where s.id = submission_id
        and s.participant_id = (select auth.uid())
    )
  );

create policy "Admins can create evaluations"
  on public.evaluations
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update evaluations"
  on public.evaluations
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete evaluations"
  on public.evaluations
  for delete
  to authenticated
  using ((select public.is_admin()));

create policy "Authenticated users can read calendar settings"
  on public.calendar_settings
  for select
  to authenticated
  using (true);

create policy "Admins can update calendar settings"
  on public.calendar_settings
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit
)
values (
  'mission-photos',
  'mission-photos',
  false,
  5242880
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880;

create policy "Participants and admins can read mission photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'mission-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_admin())
    )
  );

create policy "Participants can upload their own mission photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'mission-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Admins can delete mission photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'mission-photos'
    and (select public.is_admin())
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
