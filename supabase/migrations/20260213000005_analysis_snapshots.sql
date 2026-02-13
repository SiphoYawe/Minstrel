-- 005_analysis_snapshots.sql: Silence-triggered analysis snapshots

create table public.analysis_snapshots (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  snapshot_type text not null default 'silence_triggered',
  key_detected text,
  chords_used jsonb,
  timing_accuracy numeric,
  tempo_bpm integer,
  key_insight text,
  tendency_data jsonb,
  snapshot_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

create index idx_analysis_snapshots_session on public.analysis_snapshots (session_id, snapshot_at);
