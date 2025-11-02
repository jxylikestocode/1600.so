/**
 * Analytics Database Operations
 *
 * Handles storing and retrieving analytics events from Supabase
 */

import { createClient } from "@/lib/supabase/client";

/**
 * Store a single analytics event in the database
 */
export async function storeEvent({ userId, sessionId, eventType, eventData, pagePath }) {
  const supabase = createClient();

  try {
    // Get the next sequence number for this session
    const { data: lastEvent } = await supabase
      .from("analytics_events")
      .select("sequence_number")
      .eq("session_id", sessionId)
      .order("sequence_number", { ascending: false })
      .limit(1)
      .single();

    const sequenceNumber = lastEvent ? lastEvent.sequence_number + 1 : 1;

    const { data, error } = await supabase
      .from("analytics_events")
      .insert({
        user_id: userId,
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
        page_path: pagePath,
        sequence_number: sequenceNumber,
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing event:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in storeEvent:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Store multiple analytics events in a batch
 */
export async function storeBatchEvents(events) {
  const supabase = createClient();

  try {
    // Group events by session
    const sessionGroups = {};
    events.forEach(event => {
      if (!sessionGroups[event.sessionId]) {
        sessionGroups[event.sessionId] = [];
      }
      sessionGroups[event.sessionId].push(event);
    });

    // Get last sequence numbers for each session
    const sessionIds = Object.keys(sessionGroups);
    const sequenceMap = {};

    for (const sessionId of sessionIds) {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("sequence_number")
        .eq("session_id", sessionId)
        .order("sequence_number", { ascending: false })
        .limit(1);

      if (error) {
        console.error(`Error fetching sequence for session ${sessionId}:`, error);
        sequenceMap[sessionId] = 0;
      } else {
        sequenceMap[sessionId] = data && data.length > 0 ? data[0].sequence_number : 0;
      }
    }

    // Prepare events with sequence numbers
    const eventsToInsert = events.map((event) => {
      sequenceMap[event.sessionId] = (sequenceMap[event.sessionId] || 0) + 1;

      return {
        user_id: event.userId,
        session_id: event.sessionId,
        event_type: event.eventType,
        event_data: event.eventData || {},
        page_path: event.pagePath || '/',
        sequence_number: sequenceMap[event.sessionId],
      };
    });

    // Insert all events
    const { data, error } = await supabase
      .from("analytics_events")
      .insert(eventsToInsert)
      .select();

    if (error) {
      console.error("Error storing batch events:", JSON.stringify(error, null, 2));
      console.error("Failed events sample:", JSON.stringify(eventsToInsert[0], null, 2));
      return { success: false, error: error.message };
    }

    console.log(`Successfully stored ${data.length} events`);
    return { success: true, data };
  } catch (error) {
    console.error("Error in storeBatchEvents:", error.message);
    console.error("Error stack:", error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Get all users with their activity summary
 */
export async function getAllUsersWithActivity() {
  const supabase = createClient();

  try {
    // Get all unique users with their event counts and last activity
    const { data, error } = await supabase
      .rpc("get_users_activity_summary");

    if (error) {
      console.error("Error getting users:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getAllUsersWithActivity:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a user's complete event journey
 */
export async function getUserJourney(userId) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error getting user journey:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getUserJourney:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a session's events
 */
export async function getSessionEvents(sessionId) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("sequence_number", { ascending: true });

    if (error) {
      console.error("Error getting session events:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getSessionEvents:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update or create a user session
 */
export async function upsertUserSession({ userId, sessionId, deviceInfo }) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("user_sessions")
      .upsert({
        user_id: userId,
        session_id: sessionId,
        last_activity_at: new Date().toISOString(),
        device_info: deviceInfo,
        is_active: true,
      }, {
        onConflict: "session_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting session:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in upsertUserSession:", error);
    return { success: false, error: error.message };
  }
}
