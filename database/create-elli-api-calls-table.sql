-- ============================================================================
-- ELLI API CALLS TRACKING TABLE
-- ============================================================================
-- Purpose: Track OpenAI API calls for rate limiting and cost management
-- Created: 2025-10-14
-- ============================================================================

-- Create table for tracking Elli's OpenAI API calls
CREATE TABLE IF NOT EXISTS elli_api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL, -- 'milestone', 'pattern_discovery', 'weekly_summary'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional: Track costs and tokens
  tokens_used INTEGER,
  cost_usd NUMERIC(10, 6)
);

-- Indexes for fast rate limiting queries
CREATE INDEX IF NOT EXISTS idx_elli_api_calls_user_id ON elli_api_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_elli_api_calls_created_at ON elli_api_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_elli_api_calls_user_date ON elli_api_calls(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE elli_api_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own API call history
CREATE POLICY "Users can view their own API calls"
  ON elli_api_calls
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only server can insert (via service role)
CREATE POLICY "Service role can insert API calls"
  ON elli_api_calls
  FOR INSERT
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE elli_api_calls IS 'Tracks OpenAI API calls for rate limiting and cost management';
COMMENT ON COLUMN elli_api_calls.message_type IS 'Type of message that triggered API call: milestone, pattern_discovery, weekly_summary';
COMMENT ON COLUMN elli_api_calls.tokens_used IS 'Number of tokens consumed by this API call';
COMMENT ON COLUMN elli_api_calls.cost_usd IS 'Estimated cost in USD for this API call';

-- ============================================================================
-- USAGE STATISTICS VIEW
-- ============================================================================
-- Helpful view for monitoring API usage and costs

CREATE OR REPLACE VIEW elli_api_usage_stats AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) as calls_count,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  array_agg(message_type) as message_types
FROM elli_api_calls
GROUP BY user_id, DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW elli_api_usage_stats IS 'Daily API usage statistics per user';

-- ============================================================================
-- RATE LIMITING HELPER FUNCTION
-- ============================================================================
-- Function to check if user is within rate limits

CREATE OR REPLACE FUNCTION check_elli_rate_limit(
  p_user_id UUID,
  p_max_calls_per_day INTEGER DEFAULT 5,
  p_min_hours_between INTEGER DEFAULT 4
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_calls_today INTEGER;
  v_last_call_time TIMESTAMP WITH TIME ZONE;
  v_hours_since_last NUMERIC;
BEGIN
  -- Check calls today
  SELECT COUNT(*)
  INTO v_calls_today
  FROM elli_api_calls
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;
  
  IF v_calls_today >= p_max_calls_per_day THEN
    RETURN FALSE; -- Rate limited: too many calls today
  END IF;
  
  -- Check time since last call
  SELECT created_at
  INTO v_last_call_time
  FROM elli_api_calls
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_last_call_time IS NOT NULL THEN
    v_hours_since_last := EXTRACT(EPOCH FROM (NOW() - v_last_call_time)) / 3600;
    
    IF v_hours_since_last < p_min_hours_between THEN
      RETURN FALSE; -- Rate limited: too soon since last call
    END IF;
  END IF;
  
  RETURN TRUE; -- Within rate limits
END;
$$;

COMMENT ON FUNCTION check_elli_rate_limit IS 'Check if user is within Elli API rate limits (max 5 calls/day, min 4 hours between calls)';

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Get today's API calls for a user
-- SELECT * FROM elli_api_calls 
-- WHERE user_id = 'user-id-here' 
--   AND created_at >= CURRENT_DATE;

-- Check if user is rate limited
-- SELECT check_elli_rate_limit('user-id-here');

-- Get daily usage stats for last 7 days
-- SELECT * FROM elli_api_usage_stats 
-- WHERE user_id = 'user-id-here' 
--   AND date >= CURRENT_DATE - INTERVAL '7 days';

-- Get total cost this month
-- SELECT 
--   user_id,
--   SUM(cost_usd) as monthly_cost,
--   COUNT(*) as total_calls
-- FROM elli_api_calls
-- WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
-- GROUP BY user_id;

