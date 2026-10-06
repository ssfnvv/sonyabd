-- Кто сейчас на сайте. Запустить один раз: Supabase → SQL Editor → New query → вставить → Run.
create table if not exists presence (
  session_id text primary key,
  friend_id uuid references friends(id) on delete set null,
  name text,
  path text,
  last_seen timestamptz not null default now()
);
create index if not exists presence_last_seen on presence (last_seen desc);
alter table presence enable row level security;
