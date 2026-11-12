alter table public.missions
  add column if not exists title_es text,
  add column if not exists description_es text,
  add column if not exists title_ca text,
  add column if not exists description_ca text;
