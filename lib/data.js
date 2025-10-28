import fs from 'fs';
import path from 'path';

/**
 * Data utility functions for SAT Question Bank
 *
 * These functions run on the SERVER ONLY (not in the browser)
 * They use Node.js 'fs' (file system) to read JSON files
 */

// Cache to avoid reading files multiple times
let questionsCache = null;

/**
 * getAllQuestions()
 *
 * Purpose: Load all questions from both JSON files
 * Returns: Array of all questions with 'subject' field added
 *
 * How it works:
 * 1. Check cache first (avoid re-reading files)
 * 2. Read math-mine.enriched.json
 * 3. Read reading-mine.enriched.json
 * 4. Add 'subject' field to each question
 * 5. Combine and cache the results
 */
export async function getAllQuestions() {
  // Return cached data if available
  if (questionsCache) {
    return questionsCache;
  }

  // Get the path to the data folder
  const dataDir = path.join(process.cwd(), 'data');

  // Read math questions
  const mathPath = path.join(dataDir, 'math-mine.enriched.json');
  const mathData = JSON.parse(fs.readFileSync(mathPath, 'utf8'));
  const mathQuestions = mathData.map(q => ({ ...q, subject: 'math' }));

  // Read reading/writing questions
  const readingPath = path.join(dataDir, 'reading-mine.enriched.json');
  const readingData = JSON.parse(fs.readFileSync(readingPath, 'utf8'));
  const readingQuestions = readingData.map(q => ({ ...q, subject: 'reading-writing' }));

  // Combine and cache
  questionsCache = [...mathQuestions, ...readingQuestions];

  return questionsCache;
}

/**
 * getQuestionById(questionId)
 *
 * Purpose: Get a single question by its ID
 * Params: questionId (string) - e.g., "ac472881"
 * Returns: Question object or undefined if not found
 */
export async function getQuestionById(questionId) {
  const allQuestions = await getAllQuestions();
  return allQuestions.find(q => q.questionId === questionId);
}

/**
 * getQuestionStats()
 *
 * Purpose: Calculate statistics about the question bank
 * Returns: Object with counts by subject, difficulty, etc.
 */
export async function getQuestionStats() {
  const allQuestions = await getAllQuestions();

  return {
    total: allQuestions.length,
    math: allQuestions.filter(q => q.subject === 'math').length,
    readingWriting: allQuestions.filter(q => q.subject === 'reading-writing').length,
    easy: allQuestions.filter(q => q.difficulty === 'E').length,
    medium: allQuestions.filter(q => q.difficulty === 'M').length,
    hard: allQuestions.filter(q => q.difficulty === 'H').length,
  };
}

/**
 * getSkillBreakdown(subject)
 *
 * Purpose: Group questions by category and skill for a subject
 * Params: subject (string) - 'math' or 'reading-writing'
 * Returns: Array of categories with nested skills
 *
 * Example output:
 * [
 *   {
 *     category: "Algebra",
 *     skills: [
 *       { name: "Linear equations in one variable", count: 45 },
 *       { name: "Systems of two linear equations", count: 32 }
 *     ]
 *   }
 * ]
 */
export async function getSkillBreakdown(subject) {
  const allQuestions = await getAllQuestions();
  const subjectQuestions = allQuestions.filter(q => q.subject === subject);

  // Group by category (primary_class_cd_desc)
  const categoryMap = {};

  subjectQuestions.forEach(q => {
    const category = q.primary_class_cd_desc;
    const skill = q.skill_desc;

    if (!categoryMap[category]) {
      categoryMap[category] = {};
    }

    if (!categoryMap[category][skill]) {
      categoryMap[category][skill] = 0;
    }

    categoryMap[category][skill]++;
  });

  // Convert to array format
  return Object.entries(categoryMap).map(([category, skills]) => ({
    category,
    skills: Object.entries(skills).map(([name, count]) => ({
      name,
      count
    }))
  }));
}
