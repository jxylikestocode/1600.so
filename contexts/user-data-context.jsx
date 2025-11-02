"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import * as storage from '@/lib/local-storage';
import { useAuth } from '@/hooks/useAuth';
import * as supabaseData from '@/lib/supabase-data';
import { performFullMigration, hasUserMigratedData, migrateTempUserToAuth } from '@/lib/migration';
import { LoginModal } from '@/components/auth/login-modal';
import { updateUserId, trackAuth } from '@/lib/analytics';

const UserDataContext = createContext(null);

export function UserDataProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'synced', 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const { user, isAuthenticated } = useAuth();

  // Get current user ID (auth user or temp user)
  const getUserId = async () => {
    if (isAuthenticated && user) {
      return user.id;
    }

    // For anonymous users, create or get temp user
    const tempUserResult = await supabaseData.getOrCreateTempUser();
    return tempUserResult.success ? tempUserResult.userId : null;
  };

  // Load initial data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStats(storage.getStats());
      setBookmarks(storage.getBookmarks());
    }
  }, [refreshTrigger]);

  // Sync with Supabase when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Update analytics user ID to link anonymous activity
      updateUserId(user.id);
      trackAuth('login', user.app_metadata?.provider || 'google');

      loadFromSupabase(user.id);
    }
  }, [isAuthenticated, user]);

  // Force refresh of all data
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Load data from Supabase and update localStorage
  const loadFromSupabase = async (userId) => {
    try {
      setSyncStatus('syncing');

      // Mark that this user has an account (even if no data migrated yet)
      storage.markUserHasAccount();

      // Check if user has already migrated
      const alreadyMigrated = await hasUserMigratedData(userId);

      if (!alreadyMigrated) {
        // Check for temp user data to migrate
        const tempUserId = localStorage.getItem('temp_user_id');
        if (tempUserId) {
          console.log('Migrating temp user data to authenticated user');
          await migrateTempUserToAuth(tempUserId, userId);
        } else {
          // Migrate localStorage data
          console.log('Migrating localStorage data to Supabase');
          await performFullMigration(userId);
        }
      }

      // Fetch data from Supabase
      const result = await supabaseData.fetchUserDataFromSupabase(userId);

      if (result.success && result.data) {
        // Only update localStorage if Supabase has actual data
        // Check if there's any meaningful data (answers, bookmarks, etc.)
        const hasData =
          (result.data.answers && Object.keys(result.data.answers).length > 0) ||
          (result.data.bookmarks && result.data.bookmarks.length > 0) ||
          (result.data.eliminatedChoices && Object.keys(result.data.eliminatedChoices).length > 0);

        if (hasData) {
          console.log('Updating localStorage with Supabase data');
          storage.importData(result.data);
        } else {
          console.log('Supabase has no data yet, keeping localStorage data');
        }

        refresh();
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        console.error('Failed to load from Supabase:', result.error);
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      setSyncStatus('error');
    }
  };

  // Sync localStorage to Supabase
  const syncToSupabase = async () => {
    const userId = await getUserId();
    if (!userId) return;

    try {
      setSyncStatus('syncing');
      await performFullMigration(userId);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      setSyncStatus('error');
    }
  };

  // Save answer (dual-write: localStorage + Supabase)
  const saveAnswer = async (questionId, answer, isCorrect, timeSpent, questionMeta) => {
    // Trigger login prompt if user has account but is logged out
    if (storage.hasUserAccount() && !isAuthenticated) {
      setShowLoginPrompt(true);
      return { success: false, error: 'Please log in to save your progress', requiresLogin: true };
    }

    // Write to localStorage immediately (always works, even offline)
    const result = storage.saveAnswer(questionId, answer, isCorrect, timeSpent, questionMeta);
    refresh();

    // Write to Supabase asynchronously (only for authenticated users)
    if (isAuthenticated && user) {
      try {
        await supabaseData.saveAnswerToSupabase(
          user.id,
          questionId,
          answer,
          isCorrect,
          timeSpent,
          questionMeta
        );
      } catch (error) {
        console.error('Failed to save answer to Supabase:', error);
        // Don't throw - we still have localStorage data
      }
    }

    return result;
  };

  // Toggle bookmark (dual-write)
  const toggleBookmark = async (questionId) => {
    // Trigger login prompt if user has account but is logged out
    if (storage.hasUserAccount() && !isAuthenticated) {
      setShowLoginPrompt(true);
      return { requiresLogin: true };
    }

    // Write to localStorage immediately
    const isBookmarked = storage.toggleBookmark(questionId);
    refresh();

    // Write to Supabase asynchronously (only for authenticated users)
    if (isAuthenticated && user) {
      try {
        if (isBookmarked) {
          await supabaseData.saveBookmarkToSupabase(user.id, questionId);
        } else {
          await supabaseData.removeBookmarkFromSupabase(user.id, questionId);
        }
      } catch (error) {
        console.error('Failed to sync bookmark to Supabase:', error);
      }
    }

    return isBookmarked;
  };

  // Save eliminated choices (dual-write)
  const saveEliminatedChoices = async (questionId, choiceIds) => {
    // Block if user has account but is logged out
    if (storage.hasUserAccount() && !isAuthenticated) {
      console.warn('Cannot save eliminated choices: User has account but is not logged in');
      return;
    }

    // Write to localStorage immediately
    storage.saveEliminatedChoices(questionId, choiceIds);

    // Write to Supabase asynchronously (only for authenticated users)
    if (isAuthenticated && user) {
      try {
        await supabaseData.saveEliminatedChoicesToSupabase(user.id, questionId, choiceIds);
      } catch (error) {
        console.error('Failed to sync eliminated choices to Supabase:', error);
      }
    }
  };

  // Get eliminated choices
  const getEliminatedChoices = (questionId) => {
    return storage.getEliminatedChoices(questionId);
  };

  const value = {
    // Data
    stats,
    bookmarks,
    syncStatus,
    lastSyncTime,

    // Login prompt state
    showLoginPrompt,
    setShowLoginPrompt,

    // Actions
    saveAnswer,
    toggleBookmark,
    saveEliminatedChoices,
    getEliminatedChoices,
    getQuestionHistory: storage.getQuestionHistory,
    isBookmarked: storage.isBookmarked,
    getIncorrectQuestionIds: storage.getIncorrectQuestionIds,
    getStatsBySubject: storage.getStatsBySubject,
    getStatsBySkill: storage.getStatsBySkill,
    getAllAnsweredQuestions: storage.getAllAnsweredQuestions,

    // Sync functions
    syncToSupabase,
    loadFromSupabase,

    // Utilities
    refresh,
    clearAllData: () => {
      storage.clearAllData();
      refresh();
    },
    exportData: storage.exportData,
    importData: (data) => {
      storage.importData(data);
      refresh();
    },
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
      <LoginModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
}
