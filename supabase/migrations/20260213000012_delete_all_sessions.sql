-- 012_delete_all_sessions.sql: Remove all existing session data
-- Cascades to midi_events, analysis_snapshots, drill_records, ai_conversations

truncate table public.sessions cascade;
