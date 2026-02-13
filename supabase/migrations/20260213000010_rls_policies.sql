-- 010_rls_policies.sql: Row Level Security for all tables

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.user_api_keys enable row level security;
alter table public.sessions enable row level security;
alter table public.midi_events enable row level security;
alter table public.analysis_snapshots enable row level security;
alter table public.drill_records enable row level security;
alter table public.progress_metrics enable row level security;
alter table public.personal_records enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;

-- users policies
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);
create policy "users_delete_own" on public.users for delete using (auth.uid() = id);

-- user_api_keys policies
create policy "api_keys_select_own" on public.user_api_keys for select using (auth.uid() = user_id);
create policy "api_keys_insert_own" on public.user_api_keys for insert with check (auth.uid() = user_id);
create policy "api_keys_update_own" on public.user_api_keys for update using (auth.uid() = user_id);
create policy "api_keys_delete_own" on public.user_api_keys for delete using (auth.uid() = user_id);

-- sessions policies
create policy "sessions_select_own" on public.sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.sessions for update using (auth.uid() = user_id);
create policy "sessions_delete_own" on public.sessions for delete using (auth.uid() = user_id);

-- midi_events policies
create policy "midi_events_select_own" on public.midi_events for select using (auth.uid() = user_id);
create policy "midi_events_insert_own" on public.midi_events for insert with check (auth.uid() = user_id);
create policy "midi_events_update_own" on public.midi_events for update using (auth.uid() = user_id);
create policy "midi_events_delete_own" on public.midi_events for delete using (auth.uid() = user_id);

-- analysis_snapshots policies
create policy "snapshots_select_own" on public.analysis_snapshots for select using (auth.uid() = user_id);
create policy "snapshots_insert_own" on public.analysis_snapshots for insert with check (auth.uid() = user_id);
create policy "snapshots_update_own" on public.analysis_snapshots for update using (auth.uid() = user_id);
create policy "snapshots_delete_own" on public.analysis_snapshots for delete using (auth.uid() = user_id);

-- drill_records policies
create policy "drills_select_own" on public.drill_records for select using (auth.uid() = user_id);
create policy "drills_insert_own" on public.drill_records for insert with check (auth.uid() = user_id);
create policy "drills_update_own" on public.drill_records for update using (auth.uid() = user_id);
create policy "drills_delete_own" on public.drill_records for delete using (auth.uid() = user_id);

-- progress_metrics policies
create policy "metrics_select_own" on public.progress_metrics for select using (auth.uid() = user_id);
create policy "metrics_insert_own" on public.progress_metrics for insert with check (auth.uid() = user_id);
create policy "metrics_update_own" on public.progress_metrics for update using (auth.uid() = user_id);
create policy "metrics_delete_own" on public.progress_metrics for delete using (auth.uid() = user_id);

-- personal_records policies
create policy "records_select_own" on public.personal_records for select using (auth.uid() = user_id);
create policy "records_insert_own" on public.personal_records for insert with check (auth.uid() = user_id);
create policy "records_update_own" on public.personal_records for update using (auth.uid() = user_id);
create policy "records_delete_own" on public.personal_records for delete using (auth.uid() = user_id);

-- ai_conversations policies
create policy "conversations_select_own" on public.ai_conversations for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.ai_conversations for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.ai_conversations for update using (auth.uid() = user_id);
create policy "conversations_delete_own" on public.ai_conversations for delete using (auth.uid() = user_id);

-- achievement_definitions: public read-only (reference data).
-- No INSERT/UPDATE/DELETE policies — managed exclusively via service_role key
-- (migrations, seed scripts, or admin API). This is intentional.
create policy "achievements_select_all" on public.achievement_definitions for select using (true);

-- user_achievements policies
create policy "user_achievements_select_own" on public.user_achievements for select using (auth.uid() = user_id);
create policy "user_achievements_insert_own" on public.user_achievements for insert with check (auth.uid() = user_id);
create policy "user_achievements_update_own" on public.user_achievements for update using (auth.uid() = user_id);
create policy "user_achievements_delete_own" on public.user_achievements for delete using (auth.uid() = user_id);
