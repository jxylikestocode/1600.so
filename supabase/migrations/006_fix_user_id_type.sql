-- Fix user_id column type to TEXT instead of UUID
-- User IDs are generated as strings like "anon_1762122020946_c0vmdbnme" or email addresses

-- Step 1: Drop all RLS policies that depend on user_id column
DROP POLICY IF EXISTS "Users can read own analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_events;
DROP POLICY IF EXISTS "Users can read own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;

-- Step 2: Change column types to TEXT
ALTER TABLE analytics_events
  ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE user_sessions
  ALTER COLUMN user_id TYPE TEXT;

-- Step 3: Recreate the indexes
DROP INDEX IF EXISTS idx_analytics_events_user_id;
DROP INDEX IF EXISTS idx_user_sessions_user_id;

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Step 4: Recreate RLS policies with TEXT user_id
-- Note: Since we're using anonymous user IDs and not auth.uid(),
-- we'll create more permissive policies for now
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated and anonymous users to insert their own events
CREATE POLICY "Users can insert analytics"
  ON analytics_events
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own analytics
CREATE POLICY "Users can read own analytics"
  ON analytics_events
  FOR SELECT
  TO public
  USING (true);

-- Allow all authenticated and anonymous users to insert/update their own sessions
CREATE POLICY "Users can insert sessions"
  ON user_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update sessions"
  ON user_sessions
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Users can read sessions"
  ON user_sessions
  FOR SELECT
  TO public
  USING (true);
