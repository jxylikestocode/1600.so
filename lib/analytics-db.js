/**
 * Analytics Database Operations
 *
 * Handles storing and retrieving analytics events from Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Create admin client directly
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Debug logging for production
  if (!url || !key) {
    console.error('Missing Supabase credentials:', {
      hasUrl: !!url,
      hasKey: !!key,
      urlLength: url?.length,
      keyLength: key?.length
    });
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Store a single analytics event in the database
 */
export async function storeEvent({ userId, sessionId, eventType, eventData, pagePath }) {
  const supabase = getAdminClient();

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
  const supabase = getAdminClient();

  console.log(`[Analytics] Storing ${events.length} events...`);

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
  const supabase = getAdminClient();

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
 * Get a user's complete event journey with session information
 */
export async function getUserJourney(userId) {
  const supabase = getAdminClient();

  try {
    // Get all events for the user
    const { data: events, error: eventsError } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (eventsError) {
      console.error("Error getting user journey:", eventsError);
      return { success: false, error: eventsError.message };
    }

    // Get all sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: true });

    if (sessionsError) {
      console.error("Error getting user sessions:", sessionsError);
      return { success: false, error: sessionsError.message };
    }

    // Create a session map for quick lookup
    const sessionMap = {};
    sessions?.forEach(session => {
      sessionMap[session.session_id] = session;
    });

    // Group events by session and calculate time gaps
    const groupedSessions = {};
    let previousEvent = null;

    events.forEach(event => {
      const sessionId = event.session_id;

      if (!groupedSessions[sessionId]) {
        groupedSessions[sessionId] = {
          sessionId,
          sessionInfo: sessionMap[sessionId] || null,
          events: [],
          firstEvent: event.created_at,
          lastEvent: event.created_at,
        };
      }

      // Calculate time gap from previous event (in same session)
      let timeGapSeconds = null;
      if (previousEvent && previousEvent.session_id === sessionId) {
        const currentTime = new Date(event.created_at).getTime();
        const previousTime = new Date(previousEvent.created_at).getTime();
        timeGapSeconds = Math.floor((currentTime - previousTime) / 1000);
      }

      groupedSessions[sessionId].events.push({
        ...event,
        timeGapSeconds,
      });
      groupedSessions[sessionId].lastEvent = event.created_at;
      previousEvent = event;
    });

    // Calculate session durations and convert to array
    const sessionsArray = Object.values(groupedSessions).map(session => {
      const startTime = new Date(session.firstEvent).getTime();
      const endTime = new Date(session.lastEvent).getTime();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      return {
        ...session,
        durationSeconds,
        eventCount: session.events.length,
      };
    });

    return {
      success: true,
      data: {
        events, // Keep original flat events for backward compatibility
        sessions: sessionsArray, // New grouped format
      }
    };
  } catch (error) {
    console.error("Error in getUserJourney:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a session's events
 */
export async function getSessionEvents(sessionId) {
  const supabase = getAdminClient();

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
  const supabase = getAdminClient();

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
