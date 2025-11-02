/**
 * Filter Utility Functions
 *
 * Functions to filter questions based on filter criteria
 */

/**
 * Get score bands from difficulty level
 */
function getDifficultyBands(difficulty) {
  const bandMap = {
    easy: [1, 2, 3],
    medium: [4, 5],
    hard: [6, 7],
  };
  return bandMap[difficulty] || [];
}

/**
 * Get difficulty level from score band
 */
function getBandDifficulty(band) {
  if ([1, 2, 3].includes(band)) return 'easy';
  if ([4, 5].includes(band)) return 'medium';
  if ([6, 7].includes(band)) return 'hard';
  return null;
}

/**
 * Apply all filters to a list of questions
 *
 * @param {Array} questions - Array of question objects
 * @param {Object} filters - Filter state object
 * @returns {Array} Filtered questions
 */
export function applyFilters(questions, filters) {
  return questions.filter((question) => {
    // Filter by Subject (math / reading-writing)
    if (filters.selectedSubject && filters.selectedSubject !== 'all') {
      if (question.subject !== filters.selectedSubject) {
        return false;
      }
    }

    // Filter by Domain (primary_class_cd_desc)
    if (filters.selectedDomain && filters.selectedDomain !== 'all') {
      if (question.primary_class_cd_desc !== filters.selectedDomain) {
        return false;
      }
    }

    // Filter by Skill (skill_desc)
    if (filters.selectedSkill && filters.selectedSkill !== 'all') {
      if (question.skill_desc !== filters.selectedSkill) {
        return false;
      }
    }

    // Filter by Active Questions (bluebook)
    // Note: This would require a 'bluebook' field in your question data
    // For now, we'll skip this since the data structure doesn't have it
    // if (filters.activeQuestions === 'bluebook' && !question.bluebook) return false;
    // if (filters.activeQuestions === 'exclude-bluebook' && question.bluebook) return false;

    // Filter by Released (date)
    // Note: This would require a 'released' or 'release_date' field
    // For now, we'll skip this
    // if (filters.released !== 'all' && question.released !== filters.released) return false;

    // Filter by Program (SAT/PSAT)
    // Note: This would require a 'program' field
    // For now, we'll skip this
    // if (filters.program !== 'all' && question.program !== filters.program) return false;

    // Filter by Difficulty / Score Band
    if (filters.selectedBands.length > 0) {
      // If specific bands are selected, check if question's band is in the selection
      const questionBand = question.score_band_range_cd;
      if (!filters.selectedBands.includes(questionBand)) {
        return false;
      }
    }
    // If selectedBands is empty [], it means "All" is selected, so we don't filter

    // Filter by Status (Marked for Review, Solved, Answered Incorrectly)
    // Note: These would require fields in the question data for user progress
    // For now, we'll skip these since they're user-specific state
    // if (filters.markedForReview !== 'all') { ... }
    // if (filters.solved !== 'all') { ... }
    // if (filters.answeredIncorrectly !== 'all') { ... }

    return true;
  });
}

/**
 * Get skill breakdown for filtered questions
 *
 * @param {Array} questions - Array of question objects
 * @param {String} subject - 'math' or 'reading-writing'
 * @returns {Array} Array of {category, skills: [{name, count}]}
 */
export function getFilteredSkillBreakdown(questions, subject) {
  const subjectQuestions = questions.filter((q) => q.subject === subject);

  // Group by category (primary_class_cd_desc)
  const categoryMap = {};
  // Track the canonical (first-seen) casing for each skill
  const skillCanonicalNames = {};

  subjectQuestions.forEach((q) => {
    const category = q.primary_class_cd_desc;
    const skill = q.skill_desc;

    // Create a lowercase key for case-insensitive grouping
    const skillKey = skill.toLowerCase();

    // Store the first-seen casing as the canonical name
    if (!skillCanonicalNames[skillKey]) {
      skillCanonicalNames[skillKey] = skill;
    }

    if (!categoryMap[category]) {
      categoryMap[category] = {};
    }

    if (!categoryMap[category][skillKey]) {
      categoryMap[category][skillKey] = 0;
    }

    categoryMap[category][skillKey]++;
  });

  // Convert to array format, using canonical names
  return Object.entries(categoryMap).map(([category, skills]) => ({
    category,
    skills: Object.entries(skills).map(([skillKey, count]) => ({
      name: skillCanonicalNames[skillKey],
      count,
    })),
  }));
}
