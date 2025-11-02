-- Simple fix: Disable RLS and change column types

-- Disable RLS first
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can read own analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can read own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can read sessions" ON user_sessions;

-- Change column types
ALTER TABLE analytics_events ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE analytics_events ALTER COLUMN session_id TYPE TEXT;

ALTER TABLE user_sessions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE user_sessions ALTER COLUMN session_id TYPE TEXT;

-- Recreate indexes
DROP INDEX IF EXISTS idx_analytics_events_user_id;
DROP INDEX IF EXISTS idx_analytics_events_session_id;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_session_id;

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
