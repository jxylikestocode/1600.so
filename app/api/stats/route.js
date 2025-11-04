import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { inferSubjectFromDomain } from "@/lib/stats-utils";
import { getAllQuestions } from "@/lib/data";

/**
 * GET /api/stats
 * Fetch user statistics from database
 *
 * Query params:
 * - userId: User ID to fetch stats for (required)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch overall stats
    const { data: overallData, error: overallError } = await supabase
      .from('user_answers')
      .select('question_id, is_correct, time_spent_seconds, created_at')
      .eq('user_id', userId);

    if (overallError) {
      console.error('Error fetching overall stats:', overallError);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // Calculate overall stats from raw data
    // We need to count unique questions (only first attempt counts for totalAnswered)
    const questionMap = new Map();
    let totalTimeSpent = 0;

    overallData.forEach(row => {
      if (!questionMap.has(row.question_id)) {
        questionMap.set(row.question_id, {
          correctAtAnyPoint: row.is_correct,
          firstAttemptTime: row.created_at,
        });
      } else {
        // Update if this attempt was correct
        const existing = questionMap.get(row.question_id);
        if (row.is_correct) {
          existing.correctAtAnyPoint = true;
        }
      }
      totalTimeSpent += row.time_spent_seconds || 0;
    });

    const totalAnswered = questionMap.size;
    const correctCount = Array.from(questionMap.values()).filter(q => q.correctAtAnyPoint).length;
    const accuracy = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
    const averageTimePerQuestion = totalAnswered > 0 ? totalTimeSpent / totalAnswered : 0;

    // Calculate streak
    const streakDays = calculateStreak(Array.from(questionMap.values()).map(q => q.firstAttemptTime));

    // Fetch stats by subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('user_answers')
      .select('question_id, question_subject, is_correct, time_spent_seconds')
      .eq('user_id', userId);

    if (subjectError) {
      console.error('Error fetching subject stats:', subjectError);
    }

    const subjectStats = {};
    if (subjectData) {
      const subjectQuestions = new Map();

      subjectData.forEach(row => {
        const subject = row.question_subject || 'reading-writing';
        if (!subjectQuestions.has(subject)) {
          subjectQuestions.set(subject, new Map());
        }

        const questions = subjectQuestions.get(subject);
        if (!questions.has(row.question_id)) {
          questions.set(row.question_id, {
            correctAtAnyPoint: row.is_correct,
            totalTime: 0,
          });
        }

        const question = questions.get(row.question_id);
        if (row.is_correct) {
          question.correctAtAnyPoint = true;
        }
        question.totalTime += row.time_spent_seconds || 0;
      });

      // Calculate stats for each subject
      subjectQuestions.forEach((questions, subject) => {
        const answered = questions.size;
        const correct = Array.from(questions.values()).filter(q => q.correctAtAnyPoint).length;
        const totalTime = Array.from(questions.values()).reduce((sum, q) => sum + q.totalTime, 0);
        const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

        subjectStats[subject] = {
          answered,
          correct,
          totalTime,
          accuracy,
        };
      });
    }

    // Fetch stats by skill - we'll enrich with question data from JSON files
    const { data: skillData, error: skillError } = await supabase
      .from('user_answers')
      .select('question_id, is_correct, time_spent_seconds')
      .eq('user_id', userId);

    if (skillError) {
      console.error('Error fetching skill stats:', skillError);
    }

    // Load all questions to get skill names
    const allQuestions = await getAllQuestions();
    const questionsLookup = new Map(allQuestions.map(q => [q.questionId, q]));

    // Build hierarchical stats: subject → domain → skills
    const domainStats = {};
    if (skillData) {
      const hierarchy = new Map();

      skillData.forEach(row => {
        // Get question metadata from the questions data
        const question = questionsLookup.get(row.question_id);

        // Use question metadata if available, otherwise fallback to stored values
        const rawSubject = question?.subject || 'Unknown';
        const domain = question?.primary_class_cd_desc || 'Unknown';
        const skill = question?.skill_desc || 'Unknown';

        // Infer correct subject from domain (fixes misclassified math questions)
        const subject = inferSubjectFromDomain(domain, rawSubject);

        // Initialize subject
        if (!hierarchy.has(subject)) {
          hierarchy.set(subject, new Map());
        }

        const subjectMap = hierarchy.get(subject);

        // Initialize domain
        if (!subjectMap.has(domain)) {
          subjectMap.set(domain, {
            skills: new Map(),
            totalQuestions: new Map(),
          });
        }

        const domainData = subjectMap.get(domain);

        // Initialize skill
        if (!domainData.skills.has(skill)) {
          domainData.skills.set(skill, new Map());
        }

        const skillQuestions = domainData.skills.get(skill);

        // Track question for skill
        if (!skillQuestions.has(row.question_id)) {
          skillQuestions.set(row.question_id, {
            correctAtAnyPoint: row.is_correct,
            totalTime: 0,
          });
        }

        const questionStats = skillQuestions.get(row.question_id);
        if (row.is_correct) {
          questionStats.correctAtAnyPoint = true;
        }
        questionStats.totalTime += row.time_spent_seconds || 0;

        // Track question for domain aggregate
        if (!domainData.totalQuestions.has(row.question_id)) {
          domainData.totalQuestions.set(row.question_id, {
            correctAtAnyPoint: row.is_correct,
            totalTime: 0,
          });
        }

        const domainQuestion = domainData.totalQuestions.get(row.question_id);
        if (row.is_correct) {
          domainQuestion.correctAtAnyPoint = true;
        }
        domainQuestion.totalTime += row.time_spent_seconds || 0;
      });

      // Calculate stats for the hierarchy
      hierarchy.forEach((subjectMap, subject) => {
        if (!domainStats[subject]) {
          domainStats[subject] = {};
        }

        subjectMap.forEach((domainData, domain) => {
          const skillsObj = {};

          // Calculate skill stats
          domainData.skills.forEach((questions, skill) => {
            const answered = questions.size;
            const correct = Array.from(questions.values()).filter(q => q.correctAtAnyPoint).length;
            const totalTime = Array.from(questions.values()).reduce((sum, q) => sum + q.totalTime, 0);
            const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

            skillsObj[skill] = {
              answered,
              correct,
              totalTime,
              accuracy,
            };
          });

          // Calculate domain aggregate stats
          const totalAnswered = domainData.totalQuestions.size;
          const totalCorrect = Array.from(domainData.totalQuestions.values()).filter(q => q.correctAtAnyPoint).length;
          const totalTime = Array.from(domainData.totalQuestions.values()).reduce((sum, q) => sum + q.totalTime, 0);
          const domainAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

          domainStats[subject][domain] = {
            skills: skillsObj,
            totalAnswered,
            totalCorrect,
            totalTime,
            accuracy: domainAccuracy,
          };
        });
      });
    }

    // Get last activity date
    const lastActivity = overallData.length > 0
      ? overallData.reduce((latest, row) => {
          return new Date(row.created_at) > new Date(latest) ? row.created_at : latest;
        }, overallData[0].created_at)
      : null;

    return NextResponse.json({
      success: true,
      stats: {
        totalAnswered,
        correctCount,
        accuracy,
        totalTimeSpent,
        averageTimePerQuestion,
        streakDays,
        lastActivity,
      },
      subjectStats,
      domainStats, // Hierarchical: subject → domain → skills
    });

  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate study streak from activity dates
 */
function calculateStreak(timestamps) {
  if (!timestamps || timestamps.length === 0) return 0;

  // Get unique dates (YYYY-MM-DD format)
  const uniqueDates = [...new Set(
    timestamps.map(ts => new Date(ts).toISOString().split('T')[0])
  )].sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if user studied today or yesterday (to maintain streak)
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const nextDate = new Date(uniqueDates[i + 1]);
    const diffDays = Math.floor((currentDate - nextDate) / 86400000);

    if (diffDays === 1) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}
