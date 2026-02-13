-- 004_midi_events.sql: Time-series MIDI event storage

create table public.midi_events (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null,
  note integer,
  velocity integer,
  channel integer default 1,
  timestamp_ms numeric not null,
  duration_ms numeric,
  created_at timestamptz default now() not null
);

create index idx_midi_events_session_timestamp on public.midi_events (session_id, timestamp_ms);
