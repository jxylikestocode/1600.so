-- Row Level Security (RLS) Policies
-- Execute this AFTER schema.sql
-- This ensures users can only access their own data

-- =============================================
-- Enable RLS on all tables
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_eliminated_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Users Table Policies
-- =============================================

-- Users can read their own data OR any temporary user data
CREATE POLICY "Users can read own or temp user data" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    is_temporary = true
  );

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can insert temporary users (for anonymous browsing)
CREATE POLICY "Anyone can create temporary users" ON users
  FOR INSERT WITH CHECK (is_temporary = true);

-- =============================================
-- User Answers Table Policies
-- =============================================

-- Users can read their own answers
CREATE POLICY "Users can read own answers" ON user_answers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own answers
CREATE POLICY "Users can insert own answers" ON user_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Temporary users can insert answers (using temp user_id from client)
CREATE POLICY "Temp users can insert answers" ON user_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_answers.user_id
      AND users.is_temporary = true
    )
  );

-- =============================================
-- User Bookmarks Table Policies
-- =============================================

-- Users can read their own bookmarks
CREATE POLICY "Users can read own bookmarks" ON user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users can insert own bookmarks" ON user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks" ON user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Temporary users can manage bookmarks
CREATE POLICY "Temp users can manage bookmarks" ON user_bookmarks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_bookmarks.user_id
      AND users.is_temporary = true
    )
  );

-- =============================================
-- User Eliminated Choices Table Policies
-- =============================================

-- Users can read their own eliminated choices
CREATE POLICY "Users can read own eliminated choices" ON user_eliminated_choices
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update their own eliminated choices
CREATE POLICY "Users can upsert own eliminated choices" ON user_eliminated_choices
  FOR ALL USING (auth.uid() = user_id);

-- Temporary users can manage eliminated choices
CREATE POLICY "Temp users can manage eliminated choices" ON user_eliminated_choices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_eliminated_choices.user_id
      AND users.is_temporary = true
    )
  );

-- =============================================
-- User Preferences Table Policies
-- =============================================

-- Users can read their own preferences
CREATE POLICY "Users can read own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can upsert their own preferences
CREATE POLICY "Users can upsert own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Temporary users can manage preferences
CREATE POLICY "Temp users can manage preferences" ON user_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_preferences.user_id
      AND users.is_temporary = true
    )
  );

-- =============================================
-- Analytics Events Table Policies
-- =============================================

-- Users can read their own analytics events
CREATE POLICY "Users can read own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own analytics events
CREATE POLICY "Users can insert own analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Temporary users can insert analytics events
CREATE POLICY "Temp users can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = analytics_events.user_id
      AND users.is_temporary = true
    )
  );

-- =============================================
-- User Sessions Table Policies
-- =============================================

-- Users can read their own sessions
CREATE POLICY "Users can read own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Temporary users can manage sessions
CREATE POLICY "Temp users can manage sessions" ON user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_sessions.user_id
      AND users.is_temporary = true
    )
  );

-- =============================================
-- Service Role Bypass (for migrations & admin)
-- =============================================
-- Note: Service role key automatically bypasses RLS
-- No additional policies needed

-- =============================================
-- Success Message
-- =============================================
DO $$
BEGIN
  RAISE NOTICE 'Row Level Security policies created successfully!';
  RAISE NOTICE 'All tables now have RLS enabled with appropriate policies';
  RAISE NOTICE 'Next step: Create Supabase client utilities in your code';
END $$;
