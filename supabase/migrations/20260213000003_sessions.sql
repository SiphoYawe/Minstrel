-- 003_sessions.sql: Practice session metadata

create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  mode text not null default 'freeform',
  key_detected text,
  tempo_avg integer,
  timing_accuracy numeric,
  duration_seconds integer,
  summary_insight text,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_sessions_user_id on public.sessions (user_id);
create index idx_sessions_started_at on public.sessions (started_at);
