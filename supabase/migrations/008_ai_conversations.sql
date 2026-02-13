-- 008_ai_conversations.sql: AI coaching chat history

create table public.ai_conversations (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null,
  content text not null,
  token_count integer,
  model text,
  provider text,
  metadata jsonb,
  created_at timestamptz default now() not null
);

create index idx_ai_conversations_session on public.ai_conversations (session_id, created_at);
