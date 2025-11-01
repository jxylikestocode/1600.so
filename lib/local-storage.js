/**
 * LocalStorage Service
 *
 * Manages all user data persistence in browser localStorage
 * Schema:
 * {
 *   answers: { questionId: { attempts: [], lastCorrect: bool, totalTimeSpent: number } },
 *   bookmarks: [questionId1, questionId2, ...],
 *   eliminatedChoices: { questionId: [choiceId1, choiceId2, ...] },
 *   stats: { totalAnswered, correctCount, totalTimeSpent, lastActivity, streakDays },
 *   preferences: { selectedBands, lastSkill, lastSubject }
 * }
 */

const STORAGE_KEY = 'sat_question_bank_data';
const STORAGE_VERSION = 1;

/**
 * Get the entire user data object from localStorage
 */
function getUserData() {
  if (typeof window === 'undefined') return getDefaultData();

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getDefaultData();

    const parsed = JSON.parse(data);

    // Migrate old versions if needed
    if (parsed.version !== STORAGE_VERSION) {
      return migrateData(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('Error reading localStorage:', error);
    return getDefaultData();
  }
}

/**
 * Save the entire user data object to localStorage
 */
function saveUserData(data) {
  if (typeof window === 'undefined') return;

  try {
    const dataWithVersion = {
      ...data,
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithVersion));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    // Handle quota exceeded
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Consider clearing old data.');
    }
  }
}

/**
 * Get default data structure
 */
function getDefaultData() {
  return {
    version: STORAGE_VERSION,
    answers: {},
    bookmarks: [],
    eliminatedChoices: {},
    stats: {
      totalAnswered: 0,
      correctCount: 0,
      totalTimeSpent: 0,
      lastActivity: null,
      streakDays: 0,
      lastStreakDate: null,
    },
    preferences: {
      selectedBands: [],
      lastSkill: null,
      lastSubject: null,
    },
  };
}

/**
 * Migrate data from old versions
 */
function migrateData(oldData) {
  // For now, just merge with defaults
  const defaults = getDefaultData();
  return {
    ...defaults,
    ...oldData,
    version: STORAGE_VERSION,
  };
}

/**
 * Save an answer attempt for a question
 */
export function saveAnswer(questionId, answer, isCorrect, timeSpent, questionMeta = {}) {
  const data = getUserData();

  if (!data.answers[questionId]) {
    data.answers[questionId] = {
      attempts: [],
      lastCorrect: false,
      totalTimeSpent: 0,
      firstAttemptAt: new Date().toISOString(),
    };
  }

  const questionData = data.answers[questionId];

  // Add this attempt
  questionData.attempts.push({
    answer,
    correct: isCorrect,
    timestamp: new Date().toISOString(),
    timeSpent,
  });

  // Update summary fields
  questionData.lastCorrect = isCorrect;
  questionData.totalTimeSpent += timeSpent;
  questionData.lastAttemptAt = new Date().toISOString();

  // Update global stats
  const isFirstAttempt = questionData.attempts.length === 1;
  if (isFirstAttempt) {
    data.stats.totalAnswered += 1;
    if (isCorrect) {
      data.stats.correctCount += 1;
    }
  } else if (isCorrect && !questionData.attempts.slice(0, -1).some(a => a.correct)) {
    // First time getting it correct (after previous wrong attempts)
    data.stats.correctCount += 1;
  }

  data.stats.totalTimeSpent += timeSpent;
  data.stats.lastActivity = new Date().toISOString();

  // Update streak
  updateStreak(data);

  saveUserData(data);

  return questionData;
}

/**
 * Get answer history for a specific question
 */
export function getQuestionHistory(questionId) {
  const data = getUserData();
  return data.answers[questionId] || null;
}

/**
 * Get all answered questions
 */
export function getAllAnsweredQuestions() {
  const data = getUserData();
  return data.answers;
}

/**
 * Toggle bookmark for a question
 */
export function toggleBookmark(questionId) {
  const data = getUserData();

  const index = data.bookmarks.indexOf(questionId);
  if (index > -1) {
    // Remove bookmark
    data.bookmarks.splice(index, 1);
  } else {
    // Add bookmark
    data.bookmarks.push(questionId);
  }

  saveUserData(data);

  return data.bookmarks.includes(questionId);
}

/**
 * Check if a question is bookmarked
 */
export function isBookmarked(questionId) {
  const data = getUserData();
  return data.bookmarks.includes(questionId);
}

/**
 * Get all bookmarked question IDs
 */
export function getBookmarks() {
  const data = getUserData();
  return data.bookmarks;
}

/**
 * Save eliminated choices for a question
 */
export function saveEliminatedChoices(questionId, choiceIds) {
  const data = getUserData();
  data.eliminatedChoices[questionId] = choiceIds;
  saveUserData(data);
}

/**
 * Get eliminated choices for a question
 */
export function getEliminatedChoices(questionId) {
  const data = getUserData();
  return data.eliminatedChoices[questionId] || [];
}

/**
 * Get overall statistics
 */
export function getStats() {
  const data = getUserData();

  const stats = {
    ...data.stats,
    accuracy: data.stats.totalAnswered > 0
      ? (data.stats.correctCount / data.stats.totalAnswered) * 100
      : 0,
    averageTimePerQuestion: data.stats.totalAnswered > 0
      ? data.stats.totalTimeSpent / data.stats.totalAnswered
      : 0,
  };

  return stats;
}

/**
 * Get statistics by subject
 */
export function getStatsBySubject(questions) {
  const data = getUserData();
  const stats = {
    math: { answered: 0, correct: 0, totalTime: 0 },
    'reading-writing': { answered: 0, correct: 0, totalTime: 0 },
  };

  Object.entries(data.answers).forEach(([questionId, history]) => {
    const question = questions.find(q => q.questionId === questionId);
    if (!question) return;

    const subject = question.subject || 'reading-writing';
    const wasCorrect = history.attempts.some(a => a.correct);

    stats[subject].answered += 1;
    if (wasCorrect) stats[subject].correct += 1;
    stats[subject].totalTime += history.totalTimeSpent;
  });

  // Calculate accuracy
  Object.keys(stats).forEach(subject => {
    stats[subject].accuracy = stats[subject].answered > 0
      ? (stats[subject].correct / stats[subject].answered) * 100
      : 0;
  });

  return stats;
}

/**
 * Get statistics by skill
 */
export function getStatsBySkill(questions) {
  const data = getUserData();
  const skillStats = {};

  Object.entries(data.answers).forEach(([questionId, history]) => {
    const question = questions.find(q => q.questionId === questionId);
    if (!question) return;

    const skill = question.skill_desc || 'Unknown';
    if (!skillStats[skill]) {
      skillStats[skill] = { answered: 0, correct: 0, totalTime: 0 };
    }

    const wasCorrect = history.attempts.some(a => a.correct);

    skillStats[skill].answered += 1;
    if (wasCorrect) skillStats[skill].correct += 1;
    skillStats[skill].totalTime += history.totalTimeSpent;
  });

  // Calculate accuracy for each skill
  Object.keys(skillStats).forEach(skill => {
    skillStats[skill].accuracy = skillStats[skill].answered > 0
      ? (skillStats[skill].correct / skillStats[skill].answered) * 100
      : 0;
  });

  return skillStats;
}

/**
 * Get questions that were answered incorrectly
 */
export function getIncorrectQuestionIds() {
  const data = getUserData();
  const incorrect = [];

  Object.entries(data.answers).forEach(([questionId, history]) => {
    // Include if never got it correct, or only got it correct after wrong attempts
    const hasCorrectAttempt = history.attempts.some(a => a.correct);
    const hasIncorrectAttempt = history.attempts.some(a => !a.correct);

    if (!hasCorrectAttempt || hasIncorrectAttempt) {
      incorrect.push(questionId);
    }
  });

  return incorrect;
}

/**
 * Save user preferences
 */
export function savePreferences(preferences) {
  const data = getUserData();
  data.preferences = {
    ...data.preferences,
    ...preferences,
  };
  saveUserData(data);
}

/**
 * Get user preferences
 */
export function getPreferences() {
  const data = getUserData();
  return data.preferences;
}

/**
 * Update study streak
 */
function updateStreak(data) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lastDate = data.stats.lastStreakDate;

  if (!lastDate) {
    // First day
    data.stats.streakDays = 1;
    data.stats.lastStreakDate = today;
  } else if (lastDate === today) {
    // Same day, no change
    return;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      // Consecutive day
      data.stats.streakDays += 1;
      data.stats.lastStreakDate = today;
    } else {
      // Streak broken
      data.stats.streakDays = 1;
      data.stats.lastStreakDate = today;
    }
  }
}

/**
 * Clear all user data (for testing or reset)
 */
export function clearAllData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export all data as JSON (for backup/migration)
 */
export function exportData() {
  return getUserData();
}

/**
 * Import data from JSON (for backup/migration)
 */
export function importData(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    saveUserData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}
