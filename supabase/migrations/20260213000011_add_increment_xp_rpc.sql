-- 011_add_increment_xp_rpc.sql: Add missing columns, unique constraint, and atomic XP increment RPC
-- Story 11.5 — Fix XP race condition with atomic Supabase RPC

-- Step 1: Add missing columns to progress_metrics
-- The existing table has metric_value but services use current_value, best_value, last_qualified_at
ALTER TABLE public.progress_metrics
  ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_qualified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill current_value from metric_value for any existing rows
UPDATE public.progress_metrics
SET current_value = metric_value,
    best_value = metric_value
WHERE current_value = 0 AND metric_value != 0;

-- Step 2: Add unique constraint on (user_id, metric_type) for upsert support
-- Use DO block to avoid error if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_progress_metrics_user_metric'
  ) THEN
    ALTER TABLE public.progress_metrics
      ADD CONSTRAINT uq_progress_metrics_user_metric UNIQUE (user_id, metric_type);
  END IF;
END
$$;

-- Step 3: Create atomic increment_xp RPC function
-- Uses INSERT ... ON CONFLICT to handle both new and existing rows atomically,
-- eliminating the read-modify-write race condition in awardXp().
CREATE OR REPLACE FUNCTION increment_xp(
  p_user_id UUID,
  p_delta NUMERIC,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_last_qualified_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO progress_metrics (user_id, metric_type, metric_value, current_value, best_value, metadata, last_qualified_at, updated_at)
  VALUES (p_user_id, 'xp', p_delta, p_delta, p_delta, p_metadata, p_last_qualified_at, NOW())
  ON CONFLICT (user_id, metric_type)
  DO UPDATE SET
    metric_value = progress_metrics.metric_value + p_delta,
    current_value = progress_metrics.current_value + p_delta,
    best_value = GREATEST(progress_metrics.best_value, progress_metrics.current_value + p_delta),
    metadata = p_metadata,
    last_qualified_at = p_last_qualified_at,
    updated_at = NOW();
END;
$$;
