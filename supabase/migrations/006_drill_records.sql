-- 006_drill_records.sql: AI drill tracking

create table public.drill_records (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade not null,
  drill_type text not null,
  target_skill text not null,
  difficulty_level numeric,
  attempts integer default 0,
  best_accuracy numeric,
  improvement_delta jsonb,
  status text default 'pending' not null,
  drill_data jsonb,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

create index idx_drill_records_user_id on public.drill_records (user_id);
