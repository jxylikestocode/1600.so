-- Fix session_id column type to TEXT instead of UUID
-- Session IDs are generated as strings, not UUIDs

ALTER TABLE analytics_events
  ALTER COLUMN session_id TYPE TEXT;

ALTER TABLE user_sessions
  ALTER COLUMN session_id TYPE TEXT;

-- Recreate the indexes
DROP INDEX IF EXISTS idx_analytics_events_session_id;
DROP INDEX IF EXISTS idx_user_sessions_session_id;

CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
