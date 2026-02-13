-- 009_achievements.sql: Achievement definitions and user unlocks

create table public.achievement_definitions (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  icon text,
  criteria jsonb not null
);

create table public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_id text references public.achievement_definitions(id) not null,
  unlocked_at timestamptz default now() not null,
  session_id uuid references public.sessions(id),
  metadata jsonb,
  constraint uq_user_achievements_user_achievement unique (user_id, achievement_id)
);

create index idx_user_achievements_user_id on public.user_achievements (user_id);
