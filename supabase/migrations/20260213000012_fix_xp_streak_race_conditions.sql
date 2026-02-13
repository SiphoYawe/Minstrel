-- 012_fix_xp_streak_race_conditions.sql
-- Story 18.4 — Fix concurrent XP and streak race conditions
-- Changes increment_xp to RETURN new values; adds atomic increment_streak RPC.

-- Step 1: Replace increment_xp to return new lifetime XP
CREATE OR REPLACE FUNCTION increment_xp(
  p_user_id UUID,
  p_delta NUMERIC,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_last_qualified_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(new_lifetime_xp NUMERIC, new_best_xp NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO progress_metrics (user_id, metric_type, metric_value, current_value, best_value, metadata, last_qualified_at, updated_at)
  VALUES (p_user_id, 'xp', p_delta, p_delta, p_delta, p_metadata, p_last_qualified_at, NOW())
  ON CONFLICT (user_id, metric_type)
  DO UPDATE SET
    metric_value = progress_metrics.metric_value + p_delta,
    current_value = progress_metrics.current_value + p_delta,
    best_value = GREATEST(progress_metrics.best_value, progress_metrics.current_value + p_delta),
    metadata = p_metadata,
    last_qualified_at = p_last_qualified_at,
    updated_at = NOW()
  RETURNING current_value AS new_lifetime_xp, best_value AS new_best_xp;
END;
$$;

-- Step 2: Create atomic increment_streak RPC
CREATE OR REPLACE FUNCTION increment_streak(
  p_user_id UUID,
  p_streak_value INTEGER DEFAULT 1,
  p_best_streak INTEGER DEFAULT 1,
  p_last_qualified_at TIMESTAMPTZ DEFAULT NOW(),
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(new_current_streak INTEGER, new_best_streak INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO progress_metrics (user_id, metric_type, metric_value, current_value, best_value, last_qualified_at, metadata, updated_at)
  VALUES (p_user_id, 'streak', p_streak_value, p_streak_value, p_best_streak, p_last_qualified_at, p_metadata, NOW())
  ON CONFLICT (user_id, metric_type)
  DO UPDATE SET
    metric_value = p_streak_value,
    current_value = p_streak_value,
    best_value = GREATEST(progress_metrics.best_value, p_best_streak),
    last_qualified_at = p_last_qualified_at,
    metadata = p_metadata,
    updated_at = NOW()
  RETURNING current_value::INTEGER AS new_current_streak, best_value::INTEGER AS new_best_streak;
END;
$$;
