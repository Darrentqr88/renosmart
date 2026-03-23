-- Migration 007: Rate limiting + token usage tracking
-- 1. ai_rate_limit table: 20-min sliding window, 10-call limit → 60-min cooldown
-- 2. Add tokens_input/tokens_output to ai_usage
-- 3. Update increment_ai_usage RPC to accumulate token counts

-- =============================================
-- ai_rate_limit (short-window rate limiting)
-- =============================================
CREATE TABLE IF NOT EXISTS ai_rate_limit (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  call_count     INTEGER NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMPTZ
);

ALTER TABLE ai_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_rate_limit_own" ON ai_rate_limit
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- Add token columns to ai_usage
-- =============================================
ALTER TABLE ai_usage
  ADD COLUMN IF NOT EXISTS tokens_input  BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_output BIGINT NOT NULL DEFAULT 0;

-- =============================================
-- Update increment_ai_usage RPC
-- New params are DEFAULT 0 → backward compatible with old callers
-- =============================================
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id      UUID,
  p_year_month   TEXT,
  p_tokens_input  BIGINT DEFAULT 0,
  p_tokens_output BIGINT DEFAULT 0
) RETURNS void AS $$
BEGIN
  INSERT INTO ai_usage (user_id, year_month, usage_count, tokens_input, tokens_output)
  VALUES (p_user_id, p_year_month, 1, p_tokens_input, p_tokens_output)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET
    usage_count    = ai_usage.usage_count + 1,
    tokens_input   = ai_usage.tokens_input + p_tokens_input,
    tokens_output  = ai_usage.tokens_output + p_tokens_output;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
