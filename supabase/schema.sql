-- Swing Game schema. Paste this whole file into the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New query -> Run). Safe to re-run.
--
-- Storage model: one row per entity with the full entity as JSONB. All
-- calculations happen client-side; the database is the group's shared,
-- durable copy of the raw data.

create table if not exists public.sg_players (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.sg_game_days (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.sg_courses (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Only signed-in users (the group's shared login) can touch anything.
alter table public.sg_players enable row level security;
alter table public.sg_game_days enable row level security;
alter table public.sg_courses enable row level security;

drop policy if exists "group full access" on public.sg_players;
create policy "group full access" on public.sg_players
  for all to authenticated using (true) with check (true);

drop policy if exists "group full access" on public.sg_game_days;
create policy "group full access" on public.sg_game_days
  for all to authenticated using (true) with check (true);

drop policy if exists "group full access" on public.sg_courses;
create policy "group full access" on public.sg_courses
  for all to authenticated using (true) with check (true);
