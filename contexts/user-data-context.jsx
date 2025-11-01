"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import * as storage from '@/lib/local-storage';

const UserDataContext = createContext(null);

export function UserDataProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load initial data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStats(storage.getStats());
      setBookmarks(storage.getBookmarks());
    }
  }, [refreshTrigger]);

  // Force refresh of all data
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Save answer and refresh stats
  const saveAnswer = (questionId, answer, isCorrect, timeSpent, questionMeta) => {
    const result = storage.saveAnswer(questionId, answer, isCorrect, timeSpent, questionMeta);
    refresh();
    return result;
  };

  // Toggle bookmark and refresh
  const toggleBookmark = (questionId) => {
    const isBookmarked = storage.toggleBookmark(questionId);
    refresh();
    return isBookmarked;
  };

  // Save eliminated choices
  const saveEliminatedChoices = (questionId, choiceIds) => {
    storage.saveEliminatedChoices(questionId, choiceIds);
  };

  // Get eliminated choices
  const getEliminatedChoices = (questionId) => {
    return storage.getEliminatedChoices(questionId);
  };

  const value = {
    // Data
    stats,
    bookmarks,

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
