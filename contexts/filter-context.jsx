'use client';

import { createContext, useContext, useState } from 'react';

/**
 * FilterContext
 *
 * Manages all filter state in one place so it can be shared between:
 * - FilterPanel (to set filters)
 * - QuestionCountSummary (to show filtered counts)
 * - QuestionList (to show filtered questions)
 *
 * Filter State:
 * - activeQuestions: 'all' | 'bluebook' | 'exclude-bluebook'
 * - released: 'all' | '2023' | '2024-oct' | '2025-mar' | '2025-aug'
 * - program: 'all' | 'sat' | 'psat-8-9' | 'psat-nmsqt'
 * - selectedBands: [] (empty = all) or array of numbers 1-7
 * - markedForReview: 'all' | 'yes' | 'no'
 * - solved: 'all' | 'yes' | 'no'
 * - answeredIncorrectly: 'all' | 'yes' | 'no'
 */

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  // Filter states
  const [activeQuestions, setActiveQuestions] = useState('all');
  const [released, setReleased] = useState('all');
  const [program, setProgram] = useState('all');
  const [selectedBands, setSelectedBands] = useState([]); // Empty = all selected
  const [markedForReview, setMarkedForReview] = useState('all');
  const [solved, setSolved] = useState('all');
  const [answeredIncorrectly, setAnsweredIncorrectly] = useState('all');

  // Hierarchical filters: Subject → Domain → Skill
  const [selectedSubject, setSelectedSubject] = useState('all'); // 'all', 'math', 'reading-writing'
  const [selectedDomain, setSelectedDomain] = useState('all'); // 'all' or domain name
  const [selectedSkill, setSelectedSkill] = useState('all'); // 'all' or skill name

  /**
   * Reset all filters to default
   */
  const resetFilters = () => {
    setActiveQuestions('all');
    setReleased('all');
    setProgram('all');
    setSelectedBands([]);
    setMarkedForReview('all');
    setSolved('all');
    setAnsweredIncorrectly('all');
    setSelectedSubject('all');
    setSelectedDomain('all');
    setSelectedSkill('all');
  };

  const value = {
    // State
    activeQuestions,
    released,
    program,
    selectedBands,
    markedForReview,
    solved,
    answeredIncorrectly,
    selectedSubject,
    selectedDomain,
    selectedSkill,

    // Setters
    setActiveQuestions,
    setReleased,
    setProgram,
    setSelectedBands,
    setMarkedForReview,
    setSolved,
    setAnsweredIncorrectly,
    setSelectedSubject,
    setSelectedDomain,
    setSelectedSkill,

    // Actions
    resetFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * Hook to use filter context
 */
export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
}
