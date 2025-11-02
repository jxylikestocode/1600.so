/**
 * TypeScript Types for Supabase Database
 *
 * These types match the database schema defined in supabase/schema.sql
 */

export interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_temporary: boolean;
  upgraded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  attempt_number: number;
  question_subject: string | null;
  question_skill: string | null;
  question_difficulty: string | null;
  created_at: string;
}

export interface UserBookmark {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
}

export interface UserEliminatedChoice {
  id: string;
  user_id: string;
  question_id: string;
  eliminated_choices: string[]; // Array of choice IDs
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  selected_bands: number[];
  last_skill: string | null;
  last_subject: string | null;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  session_id: string;
  event_type: 'answer' | 'navigation' | 'filter' | 'feature' | 'page_view';
  event_data: Record<string, any>;
  page_path: string | null;
  sequence_number: number;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_id: string;
  started_at: string;
  last_activity_at: string;
  device_info: Record<string, any>;
  is_active: boolean;
}

// Insert types (for creating new records)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UserAnswerInsert = Omit<UserAnswer, 'id' | 'created_at'>;
export type UserBookmarkInsert = Omit<UserBookmark, 'id' | 'created_at'>;
export type UserEliminatedChoiceInsert = Omit<UserEliminatedChoice, 'id' | 'updated_at'>;
export type UserPreferencesInsert = Omit<UserPreferences, 'updated_at'>;
export type AnalyticsEventInsert = Omit<AnalyticsEvent, 'id' | 'created_at'>;
export type UserSessionInsert = Omit<UserSession, 'id' | 'started_at' | 'last_activity_at'>;

// Update types (for updating existing records)
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
export type UserPreferencesUpdate = Partial<Omit<UserPreferences, 'user_id'>>;
export type UserEliminatedChoiceUpdate = Partial<Omit<UserEliminatedChoice, 'id' | 'user_id' | 'question_id'>>;
export type UserSessionUpdate = Partial<Omit<UserSession, 'id' | 'user_id' | 'session_id' | 'started_at'>>;

// Database type helper
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      user_answers: {
        Row: UserAnswer;
        Insert: UserAnswerInsert;
        Update: never; // Answers are immutable
      };
      user_bookmarks: {
        Row: UserBookmark;
        Insert: UserBookmarkInsert;
        Update: never;
      };
      user_eliminated_choices: {
        Row: UserEliminatedChoice;
        Insert: UserEliminatedChoiceInsert;
        Update: UserEliminatedChoiceUpdate;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: UserPreferencesInsert;
        Update: UserPreferencesUpdate;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: AnalyticsEventInsert;
        Update: never; // Events are immutable
      };
      user_sessions: {
        Row: UserSession;
        Insert: UserSessionInsert;
        Update: UserSessionUpdate;
      };
    };
  };
}
