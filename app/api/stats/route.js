import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    // Fetch stats by skill
    const { data: skillData, error: skillError } = await supabase
      .from('user_answers')
      .select('question_id, question_skill, is_correct, time_spent_seconds')
      .eq('user_id', userId);

    if (skillError) {
      console.error('Error fetching skill stats:', skillError);
    }

    const skillStats = {};
    if (skillData) {
      const skillQuestions = new Map();

      skillData.forEach(row => {
        const skill = row.question_skill || 'Unknown';
        if (!skillQuestions.has(skill)) {
          skillQuestions.set(skill, new Map());
        }

        const questions = skillQuestions.get(skill);
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

      // Calculate stats for each skill
      skillQuestions.forEach((questions, skill) => {
        const answered = questions.size;
        const correct = Array.from(questions.values()).filter(q => q.correctAtAnyPoint).length;
        const totalTime = Array.from(questions.values()).reduce((sum, q) => sum + q.totalTime, 0);
        const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

        skillStats[skill] = {
          answered,
          correct,
          totalTime,
          accuracy,
        };
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
      skillStats,
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
