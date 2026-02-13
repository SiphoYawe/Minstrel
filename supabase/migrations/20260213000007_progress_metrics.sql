-- 007_progress_metrics.sql: Progress metrics and personal records

create table public.progress_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  metric_type text not null,
  metric_value numeric not null,
  dimension text,
  period_start timestamptz,
  period_end timestamptz,
  metadata jsonb,
  created_at timestamptz default now() not null
);

create index idx_progress_metrics_user_type on public.progress_metrics (user_id, metric_type);

create table public.personal_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  record_type text not null,
  record_value numeric not null,
  session_id uuid references public.sessions(id) on delete set null,
  achieved_at timestamptz default now() not null,
  constraint uq_personal_records_user_type unique (user_id, record_type)
);
