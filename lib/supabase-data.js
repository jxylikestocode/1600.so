/**
 * Supabase Data Layer
 *
 * Handles all user data operations with Supabase database
 * Works alongside localStorage for dual-write and sync
 */

import { createClient } from "@/lib/supabase/client";

/**
 * Save a question answer to Supabase
 */
export async function saveAnswerToSupabase(
  userId,
  questionId,
  answer,
  isCorrect,
  timeSpent,
  metadata
) {
  if (!userId) return { success: false, error: "No user ID provided" };

  const supabase = createClient();

  try {
    // Get the next attempt number for this question
    const { data: existingAttempts } = await supabase
      .from("user_answers")
      .select("attempt_number")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .order("attempt_number", { ascending: false })
      .limit(1);

    const attemptNumber = existingAttempts?.length > 0
      ? existingAttempts[0].attempt_number + 1
      : 1;

    const { data, error} = await supabase
      .from("user_answers")
      .insert({
        user_id: userId,
        question_id: questionId,
        answer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
        attempt_number: attemptNumber,
        question_subject: metadata?.subject,
        question_skill: metadata?.skill_desc,
        question_difficulty: metadata?.difficulty,
        question_domain: metadata?.primary_class_cd_desc,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error saving answer to Supabase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a bookmark to Supabase
 */
export async function saveBookmarkToSupabase(userId, questionId) {
  if (!userId) return { success: false, error: "No user ID provided" };

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("user_bookmarks")
      .upsert(
        {
          user_id: userId,
          question_id: questionId,
        },
        {
          onConflict: "user_id,question_id",
          ignoreDuplicates: true,
        }
      )
      .select()
      .single();

    if (error && error.code !== "23505") throw error; // Ignore duplicate errors
    return { success: true, data };
  } catch (error) {
    console.error("Error saving bookmark to Supabase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a bookmark from Supabase
 */
export async function removeBookmarkFromSupabase(userId, questionId) {
  if (!userId) return { success: false, error: "No user ID provided" };

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("user_bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("question_id", questionId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error removing bookmark from Supabase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Save eliminated choices to Supabase
 */
export async function saveEliminatedChoicesToSupabase(
  userId,
  questionId,
  eliminatedChoices
) {
  if (!userId) return { success: false, error: "No user ID provided" };

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("user_eliminated_choices")
      .upsert(
        {
          user_id: userId,
          question_id: questionId,
          eliminated_choices: eliminatedChoices,
        },
        {
          onConflict: "user_id,question_id",
        }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error saving eliminated choices to Supabase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Save user preferences to Supabase
 */
export async function savePreferencesToSupabase(userId, preferences) {
  if (!userId) return { success: false, error: "No user ID provided" };

  const supabase = createClient();

  try {
    const { data, error} = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          selected_bands: preferences.selectedBands || [],
          last_skill: preferences.lastSkill,
          last_subject: preferences.lastSubject,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error saving preferences to Supabase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch all user data from Supabase
 */
export async function fetchUserDataFromSupabase(userId) {
  if (!userId) return { success: false, error: "No user ID provided" };

  const supabase = createClient();

  try {
    // Fetch all data in parallel
    const [answersResult, bookmarksResult, eliminatedResult, preferencesResult] =
      await Promise.all([
        supabase
          .from("user_answers")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("user_bookmarks")
          .select("question_id")
          .eq("user_id", userId),
        supabase
          .from("user_eliminated_choices")
          .select("*")
          .eq("user_id", userId),
        supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    if (answersResult.error) throw answersResult.error;
    if (bookmarksResult.error) throw bookmarksResult.error;
    if (eliminatedResult.error) throw eliminatedResult.error;
    if (preferencesResult.error) throw preferencesResult.error;

    // Transform Supabase data to localStorage format
    const transformedData = transformSupabaseToLocalStorage({
      answers: answersResult.data || [],
      bookmarks: bookmarksResult.data || [],
      eliminated: eliminatedResult.data || [],
      preferences: preferencesResult.data,
    });

    return { success: true, data: transformedData };
  } catch (error) {
    console.error("Error fetching user data from Supabase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Transform Supabase data format to localStorage format
 */
function transformSupabaseToLocalStorage(supabaseData) {
  const { answers, bookmarks, eliminated, preferences } = supabaseData;

  // Transform answers: flat rows → nested attempts structure
  const answersObject = {};
  answers.forEach((answer) => {
    if (!answersObject[answer.question_id]) {
      answersObject[answer.question_id] = {
        attempts: [],
        lastCorrect: false,
        totalTimeSpent: 0,
        firstAttemptAt: answer.created_at,
        lastAttemptAt: answer.created_at,
        subject: answer.question_subject,
        skill_desc: answer.question_skill,
        difficulty: answer.question_difficulty,
      };
    }

    answersObject[answer.question_id].attempts.push({
      answer: answer.answer,
      correct: answer.is_correct,
      timestamp: answer.created_at,
      timeSpent: answer.time_spent_seconds,
    });

    answersObject[answer.question_id].lastCorrect = answer.is_correct;
    answersObject[answer.question_id].totalTimeSpent += answer.time_spent_seconds;
    answersObject[answer.question_id].lastAttemptAt = answer.created_at;
  });

  // Transform bookmarks: rows → array of question IDs
  const bookmarksArray = bookmarks.map((b) => b.question_id);

  // Transform eliminated choices: rows → object
  const eliminatedObject = {};
  eliminated.forEach((e) => {
    eliminatedObject[e.question_id] = e.eliminated_choices;
  });

  // Transform preferences
  const preferencesObject = preferences
    ? {
        selectedBands: preferences.selected_bands || [],
        lastSkill: preferences.last_skill,
        lastSubject: preferences.last_subject,
      }
    : {
        selectedBands: [],
        lastSkill: null,
        lastSubject: null,
      };

  return {
    answers: answersObject,
    bookmarks: bookmarksArray,
    eliminatedChoices: eliminatedObject,
    preferences: preferencesObject,
  };
}

/**
 * Create or get temporary user for anonymous usage
 * For anonymous users, we just generate a UUID and store it locally
 * We don't create database records until they authenticate
 */
export async function getOrCreateTempUser() {
  // Check if we have a temp user ID in localStorage
  const existingTempId = localStorage.getItem("temp_user_id");

  if (existingTempId) {
    return { success: true, userId: existingTempId, isTemporary: true };
  }

  // Generate a new UUID for anonymous user (stored locally only)
  const tempUserId = crypto.randomUUID();
  localStorage.setItem("temp_user_id", tempUserId);

  return { success: true, userId: tempUserId, isTemporary: true };
}
