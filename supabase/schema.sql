-- Схема базы для сайта Сони.
-- Как применить: Supabase → SQL Editor → New query → вставить весь файл → Run.

create extension if not exists "pgcrypto";

-- Друзья: только имя, без паролей
create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

-- Общие поля модерации у каждой таблицы контента:
--   reviewed — владелица просмотрела (false = пометка «новое»)
--   hidden   — скрыто от Сони

-- Карточки таймлайна (редактор как в Toca Boca)
create table if not exists timeline (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references friends(id) on delete cascade,
  year int not null check (year between 2000 and 2030),
  story text not null default '' check (char_length(story) <= 1000),
  -- элементы карточки: [{id, kind: 'photo'|'sticker', src, x, y, scale, rotation, z}]
  elements jsonb not null default '[]'::jsonb,
  reviewed boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Голосовые: diary — радио (акт 3), call — входящий звонок (акт 4), final — конф-колл
create table if not exists audios (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references friends(id) on delete cascade,
  type text not null check (type in ('diary', 'call', 'final')),
  path text not null,
  mime text not null,
  duration_sec real,
  reviewed boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Викторина: round 1 — «кто это написал», round 2 — вопрос о Соне
create table if not exists quiz (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references friends(id) on delete cascade,
  round int not null check (round in (1, 2)),
  fact text,          -- раунд 1
  question text,      -- раунд 2
  correct text,       -- раунд 2
  wrong text[],       -- раунд 2, три варианта
  reviewed boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  check (
    (round = 1 and fact is not null)
    or (round = 2 and question is not null and correct is not null and array_length(wrong, 1) = 3)
  )
);

-- Запечатанные предсказания
create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references friends(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  reviewed boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Видео для финального трейлера
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references friends(id) on delete cascade,
  path text not null,
  mime text not null,
  duration_sec real,
  reviewed boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS включён, политик нет: браузер напрямую в базу не ходит вообще.
-- Все чтения и записи идут через серверные API-роуты сайта с service-ключом.
alter table friends enable row level security;
alter table timeline enable row level security;
alter table audios enable row level security;
alter table quiz enable row level security;
alter table predictions enable row level security;
alter table videos enable row level security;

-- Хранилище файлов. Публичное чтение (имена файлов — случайные uuid),
-- загрузка только по одноразовым подписанным ссылкам, которые выдаёт сервер.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

-- Realtime для актов (реакции/живые обновления)
alter publication supabase_realtime add table timeline;
