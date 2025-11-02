/**
 * Data Migration Utilities
 *
 * Handles one-time migration of localStorage data to Supabase
 */

import { createClient } from "@/lib/supabase/client";
import * as storage from "@/lib/local-storage";

/**
 * Migrate all localStorage data to Supabase for a user
 */
export async function performFullMigration(userId) {
  console.log(`Starting full migration for user ${userId}`);

  const results = {
    answers: { success: false, count: 0, errors: [] },
    bookmarks: { success: false, count: 0, errors: [] },
    eliminatedChoices: { success: false, count: 0, errors: [] },
    preferences: { success: false, count: 0, errors: [] },
  };

  try {
    // Get all localStorage data
    const localData = storage.exportData();

    if (!localData) {
      console.log("No localStorage data to migrate");
      return { success: true, results, message: "No data to migrate" };
    }

    // Migrate answers (most complex)
    if (localData.answers && Object.keys(localData.answers).length > 0) {
      const answersResult = await migrateAnswersToSupabase(
        userId,
        localData.answers
      );
      results.answers = answersResult;
    }

    // Migrate bookmarks
    if (localData.bookmarks && localData.bookmarks.length > 0) {
      const bookmarksResult = await migrateBookmarksToSupabase(
        userId,
        localData.bookmarks
      );
      results.bookmarks = bookmarksResult;
    }

    // Migrate eliminated choices
    if (
      localData.eliminatedChoices &&
      Object.keys(localData.eliminatedChoices).length > 0
    ) {
      const eliminatedResult = await migrateEliminatedChoicesToSupabase(
        userId,
        localData.eliminatedChoices
      );
      results.eliminatedChoices = eliminatedResult;
    }

    // Migrate preferences
    if (localData.preferences) {
      const preferencesResult = await migratePreferencesToSupabase(
        userId,
        localData.preferences
      );
      results.preferences = preferencesResult;
    }

    const totalMigrated =
      results.answers.count +
      results.bookmarks.count +
      results.eliminatedChoices.count;

    console.log(`Migration complete. Migrated ${totalMigrated} items`);

    return {
      success: true,
      results,
      message: `Successfully migrated ${totalMigrated} items`,
    };
  } catch (error) {
    console.error("Error during migration:", error);
    return {
      success: false,
      results,
      error: error.message,
    };
  }
}

/**
 * Migrate answers from localStorage to Supabase
 * Flattens the nested attempts structure into individual rows
 */
async function migrateAnswersToSupabase(userId, answersObject) {
  const supabase = createClient();
  const errors = [];
  let migratedCount = 0;

  try {
    // Flatten all attempts into individual rows
    const answerRows = [];

    for (const [questionId, questionData] of Object.entries(answersObject)) {
      if (!questionData.attempts || questionData.attempts.length === 0) continue;

      questionData.attempts.forEach((attempt, index) => {
        answerRows.push({
          user_id: userId,
          question_id: questionId,
          answer: attempt.answer,
          is_correct: attempt.correct,
          time_spent_seconds: attempt.timeSpent || 0,
          attempt_number: index + 1,
          question_subject: questionData.subject,
          question_skill: questionData.skill_desc,
          question_difficulty: questionData.difficulty,
          created_at: attempt.timestamp || new Date().toISOString(),
        });
      });
    }

    if (answerRows.length === 0) {
      return { success: true, count: 0, errors: [] };
    }

    // Batch insert answers (500 at a time to avoid timeouts)
    const batchSize = 500;
    for (let i = 0; i < answerRows.length; i += batchSize) {
      const batch = answerRows.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from("user_answers")
        .insert(batch);

      if (error) {
        console.error(`Error in batch ${i / batchSize + 1}:`, error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Batch data sample:', batch[0]);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message || JSON.stringify(error)}`);
      } else {
        migratedCount += batch.length;
      }
    }

    return {
      success: errors.length === 0,
      count: migratedCount,
      errors,
    };
  } catch (error) {
    console.error("Error migrating answers:", error);
    return {
      success: false,
      count: migratedCount,
      errors: [error.message],
    };
  }
}

/**
 * Migrate bookmarks from localStorage to Supabase
 */
async function migrateBookmarksToSupabase(userId, bookmarksArray) {
  const supabase = createClient();
  const errors = [];

  try {
    const bookmarkRows = bookmarksArray.map((questionId) => ({
      user_id: userId,
      question_id: questionId,
    }));

    const { data, error } = await supabase.from("user_bookmarks").upsert(
      bookmarkRows,
      {
        onConflict: "user_id,question_id",
        ignoreDuplicates: true,
      }
    );

    if (error) {
      console.error("Error migrating bookmarks:", error);
      errors.push(error.message);
    }

    return {
      success: errors.length === 0,
      count: bookmarksArray.length,
      errors,
    };
  } catch (error) {
    console.error("Error migrating bookmarks:", error);
    return {
      success: false,
      count: 0,
      errors: [error.message],
    };
  }
}

/**
 * Migrate eliminated choices from localStorage to Supabase
 */
async function migrateEliminatedChoicesToSupabase(userId, eliminatedObject) {
  const supabase = createClient();
  const errors = [];

  try {
    const eliminatedRows = Object.entries(eliminatedObject).map(
      ([questionId, choices]) => ({
        user_id: userId,
        question_id: questionId,
        eliminated_choices: choices,
      })
    );

    const { data, error } = await supabase
      .from("user_eliminated_choices")
      .upsert(eliminatedRows, {
        onConflict: "user_id,question_id",
      });

    if (error) {
      console.error("Error migrating eliminated choices:", error);
      errors.push(error.message);
    }

    return {
      success: errors.length === 0,
      count: eliminatedRows.length,
      errors,
    };
  } catch (error) {
    console.error("Error migrating eliminated choices:", error);
    return {
      success: false,
      count: 0,
      errors: [error.message],
    };
  }
}

/**
 * Migrate user preferences from localStorage to Supabase
 */
async function migratePreferencesToSupabase(userId, preferences) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
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
      );

    if (error) {
      console.error("Error migrating preferences:", error);
      return {
        success: false,
        count: 0,
        errors: [error.message],
      };
    }

    return {
      success: true,
      count: 1,
      errors: [],
    };
  } catch (error) {
    console.error("Error migrating preferences:", error);
    return {
      success: false,
      count: 0,
      errors: [error.message],
    };
  }
}

/**
 * Check if user has already migrated data
 */
export async function hasUserMigratedData(userId) {
  const supabase = createClient();

  try {
    const { count, error } = await supabase
      .from("user_answers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .limit(1);

    if (error) throw error;

    return count > 0;
  } catch (error) {
    console.error("Error checking migration status:", error);
    return false;
  }
}

/**
 * Migrate temporary user data to authenticated user
 * Since temp users are just local UUIDs, we update all their Supabase records
 * to use the authenticated user's ID instead
 */
export async function migrateTempUserToAuth(tempUserId, authUserId) {
  const supabase = createClient();

  console.log(`Migrating temp user ${tempUserId} to auth user ${authUserId}`);

  try {
    // Update all user_answers
    await supabase
      .from("user_answers")
      .update({ user_id: authUserId })
      .eq("user_id", tempUserId);

    // Update all user_bookmarks
    await supabase
      .from("user_bookmarks")
      .update({ user_id: authUserId })
      .eq("user_id", tempUserId);

    // Update all user_eliminated_choices
    await supabase
      .from("user_eliminated_choices")
      .update({ user_id: authUserId })
      .eq("user_id", tempUserId);

    // Update user_preferences
    await supabase
      .from("user_preferences")
      .update({ user_id: authUserId })
      .eq("user_id", tempUserId);

    // Clear temp user ID from localStorage (no database record to delete)
    localStorage.removeItem("temp_user_id");

    console.log("Temp user migration complete");
    return { success: true };
  } catch (error) {
    console.error("Error migrating temp user to auth user:", error);
    return { success: false, error: error.message };
  }
}
