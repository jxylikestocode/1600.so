-- Analytics Tables Migration
-- Creates tables for tracking user activity and sessions

-- Create analytics_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_session ON analytics_events(user_id, session_id, sequence_number);

-- Create user_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id UUID NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at DESC);

-- Create a view for user activity summary (for admin dashboard)
CREATE OR REPLACE VIEW users_activity_summary AS
SELECT
  user_id,
  COUNT(*) as total_events,
  MAX(created_at) as last_activity,
  MIN(created_at) as first_activity,
  COUNT(DISTINCT session_id) as session_count,
  COUNT(DISTINCT CASE WHEN event_type = 'answer' THEN id END) as answer_count,
  COUNT(DISTINCT CASE WHEN event_type = 'pageview' THEN id END) as pageview_count
FROM analytics_events
GROUP BY user_id;

-- Create function to get users activity summary (for API endpoint)
CREATE OR REPLACE FUNCTION get_users_activity_summary()
RETURNS TABLE (
  user_id TEXT,
  total_events BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE,
  first_activity TIMESTAMP WITH TIME ZONE,
  session_count BIGINT,
  answer_count BIGINT,
  pageview_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM users_activity_summary
  ORDER BY last_activity DESC;
END;
$$ LANGUAGE plpgsql;
