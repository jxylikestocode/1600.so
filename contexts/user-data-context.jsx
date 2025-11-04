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
  const [statsLoading, setStatsLoading] = useState(false);
  const [subjectStats, setSubjectStats] = useState(null);
  const [skillStats, setSkillStats] = useState(null);
  const [domainStats, setDomainStats] = useState(null);

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
      // For authenticated users, we'll fetch from database
      // For anonymous users, use localStorage
      if (!isAuthenticated) {
        setStats(storage.getStats());
        setSubjectStats(storage.getStatsBySubject());
        setSkillStats(storage.getStatsBySkill());
        setDomainStats(storage.getStatsByDomain());
      }
      setBookmarks(storage.getBookmarks());
    }
  }, [refreshTrigger, isAuthenticated]);

  // Sync with Supabase when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if we've already tracked login for this session
      const loginTracked = sessionStorage.getItem('analytics_login_tracked');

      if (!loginTracked) {
        // Update analytics user ID to link anonymous activity
        updateUserId(user.id);
        trackAuth('login', user.app_metadata?.provider || 'google');

        // Mark as tracked for this session
        sessionStorage.setItem('analytics_login_tracked', 'true');
      }

      loadFromSupabase(user.id);
      fetchStatsFromDatabase(user.id);
    }
  }, [isAuthenticated, user]);

  // Force refresh of all data
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);

    // Also refresh database stats for authenticated users
    if (isAuthenticated && user) {
      fetchStatsFromDatabase(user.id);
    }
  };

  // Fetch stats from database for authenticated users
  const fetchStatsFromDatabase = async (userId) => {
    if (!userId) return;

    try {
      setStatsLoading(true);

      const response = await fetch(`/api/stats?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setSubjectStats(data.subjectStats);
        setDomainStats(data.domainStats);
      } else {
        console.error('Failed to fetch stats from database:', data.error);
        // Fallback to localStorage
        setStats(storage.getStats());
        setSubjectStats(storage.getStatsBySubject());
        setDomainStats(storage.getStatsByDomain());
      }
    } catch (error) {
      console.error('Error fetching stats from database:', error);
      // Fallback to localStorage
      setStats(storage.getStats());
      setSubjectStats(storage.getStatsBySubject());
      setDomainStats(storage.getStatsByDomain());
    } finally {
      setStatsLoading(false);
    }
  };

  // Load data from Supabase and update localStorage
  const loadFromSupabase = async (userId) => {
    try {
      setSyncStatus('syncing');

      // Mark that this user has an account (even if no data migrated yet)
      storage.markUserHasAccount();

      // Check if user has already migrated
      const alreadyMigrated = await hasUserMigratedData(userId);

      console.log('loadFromSupabase:', { userId, alreadyMigrated });

      if (!alreadyMigrated) {
        // Check for temp user data to migrate
        const tempUserId = localStorage.getItem('temp_user_id');
        if (tempUserId) {
          console.log('Migrating temp user data to authenticated user');
          await migrateTempUserToAuth(tempUserId, userId);
        } else {
          // Migrate localStorage data
          console.log('Migrating localStorage data to Supabase');
          const migrationResult = await performFullMigration(userId);
          console.log('Migration result:', migrationResult);
        }
      }

      // Fetch data from Supabase
      const result = await supabaseData.fetchUserDataFromSupabase(userId);
      console.log('Fetched from Supabase:', {
        success: result.success,
        answerCount: result.data?.answers ? Object.keys(result.data.answers).length : 0,
        bookmarkCount: result.data?.bookmarks?.length || 0,
      });

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
          refresh(); // Refresh state to show the data
        } else {
          console.log('Supabase has no data yet, keeping localStorage data');
          // IMPORTANT: Still refresh to ensure context uses current localStorage data
          refresh();
        }

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
        // Refresh stats from database after saving
        fetchStatsFromDatabase(user.id);
      } catch (error) {
        console.error('Failed to save answer to Supabase:', error);
        // Don't throw - we still have localStorage data
      }
    } else {
      // For anonymous users, refresh from localStorage
      refresh();
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
    statsLoading,
    subjectStats,
    skillStats,
    domainStats,

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
    getStatsBySubject: () => {
      // For authenticated users, use database stats
      if (isAuthenticated && subjectStats) {
        return subjectStats;
      }
      // For anonymous users, use localStorage
      return storage.getStatsBySubject();
    },
    getStatsBySkill: () => {
      // For authenticated users, use database stats
      if (isAuthenticated && skillStats) {
        return skillStats;
      }
      // For anonymous users, use localStorage
      return storage.getStatsBySkill();
    },
    getStatsByDomain: () => {
      // For authenticated users, use database stats
      if (isAuthenticated && domainStats) {
        return domainStats;
      }
      // For anonymous users, use localStorage
      return storage.getStatsByDomain();
    },
    getAllAnsweredQuestions: storage.getAllAnsweredQuestions,

    // Sync functions
    syncToSupabase,
    loadFromSupabase,
    fetchStatsFromDatabase,

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
