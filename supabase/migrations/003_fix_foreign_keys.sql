-- Fix foreign key constraints to reference auth.users instead of public.users

-- Drop all existing foreign key constraints
ALTER TABLE user_answers DROP CONSTRAINT IF EXISTS user_answers_user_id_fkey;
ALTER TABLE user_bookmarks DROP CONSTRAINT IF EXISTS user_bookmarks_user_id_fkey;
ALTER TABLE user_eliminated_choices DROP CONSTRAINT IF EXISTS user_eliminated_choices_user_id_fkey;
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- Add foreign key constraints that reference auth.users
ALTER TABLE user_answers
  ADD CONSTRAINT user_answers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_bookmarks
  ADD CONSTRAINT user_bookmarks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_eliminated_choices
  ADD CONSTRAINT user_eliminated_choices_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the public.users table if it exists (we don't need it anymore)
DROP TABLE IF EXISTS users CASCADE;
