-- Review Mode schema for Supabase.
-- Run this once in the Supabase SQL editor for your project.
-- After running, enable Realtime for the `threads` and `comments` tables in
-- Database > Replication (or Database > Publications > supabase_realtime).

create table if not exists threads (
  id            uuid primary key default gen_random_uuid(),
  route         text not null,
  selector      text not null,
  x_ratio       real not null,
  y_ratio       real not null,
  element_label text,
  status        text not null default 'open' check (status in ('open','resolved')),
  created_at    timestamptz not null default now()
);
create index if not exists threads_route_idx on threads(route);

create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references threads(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 64),
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);
create index if not exists comments_thread_idx on comments(thread_id);

alter table threads  enable row level security;
alter table comments enable row level security;

-- Public read / insert / status-update policies.
-- Anyone with the anon key (i.e. anyone who loads the site) can read and write.
-- This is appropriate for a PM-review prototype only.
drop policy if exists "threads_read"   on threads;
drop policy if exists "threads_insert" on threads;
drop policy if exists "threads_update" on threads;
drop policy if exists "comments_read"   on comments;
drop policy if exists "comments_insert" on comments;

create policy "threads_read"   on threads  for select using (true);
create policy "threads_insert" on threads  for insert with check (true);
create policy "threads_update" on threads  for update using (true) with check (true);
create policy "comments_read"  on comments for select using (true);
create policy "comments_insert" on comments for insert with check (true);

-- Ensure Realtime broadcasts DML for these tables. Safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'threads'
  ) then
    execute 'alter publication supabase_realtime add table threads';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments'
  ) then
    execute 'alter publication supabase_realtime add table comments';
  end if;
end$$;
