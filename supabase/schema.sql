-- SAT Question Bank Database Schema
-- Execute this in Supabase Dashboard → SQL Editor

-- =============================================
-- 1. Users Table
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_temporary BOOLEAN DEFAULT true,
  upgraded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_temporary ON users(is_temporary);

-- =============================================
-- 2. User Answers Table
-- =============================================
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  question_subject TEXT,
  question_skill TEXT,
  question_difficulty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_user_answers_created_at ON user_answers(created_at);
CREATE INDEX idx_user_answers_user_question ON user_answers(user_id, question_id);
CREATE INDEX idx_user_answers_subject ON user_answers(question_subject);
CREATE INDEX idx_user_answers_skill ON user_answers(question_skill);

-- =============================================
-- 3. User Bookmarks Table
-- =============================================
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_question_id ON user_bookmarks(question_id);

-- =============================================
-- 4. User Eliminated Choices Table
-- =============================================
CREATE TABLE user_eliminated_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  eliminated_choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_user_eliminated_choices_user_id ON user_eliminated_choices(user_id);
CREATE INDEX idx_user_eliminated_choices_question_id ON user_eliminated_choices(question_id);

-- =============================================
-- 5. User Preferences Table
-- =============================================
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  selected_bands JSONB DEFAULT '[]'::jsonb,
  last_skill TEXT,
  last_subject TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. Analytics Events Table
-- =============================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_path TEXT,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_user_session ON analytics_events(user_id, session_id);

-- =============================================
-- 7. User Sessions Table
-- =============================================
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity_at);

-- =============================================
-- Functions & Triggers
-- =============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_eliminated_choices_updated_at BEFORE UPDATE ON user_eliminated_choices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Success Message
-- =============================================
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Tables: users, user_answers, user_bookmarks, user_eliminated_choices, user_preferences, analytics_events, user_sessions';
  RAISE NOTICE 'Next step: Run rls-policies.sql to enable Row Level Security';
END $$;
