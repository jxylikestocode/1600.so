import { NextResponse } from 'next/server';
import { storeBatchEvents, upsertUserSession } from '@/lib/analytics-db';

/**
 * Analytics API Endpoint
 *
 * Receives batched analytics events from clients
 * Stores in Supabase database for persistence
 * Also stores aggregated stats in Upstash Redis (or falls back to in-memory)
 */

// Fallback in-memory store if Redis not configured
let inMemoryStore = {
  totalEvents: 0,
  answers: {},
  skills: {},
  features: {},
  sessions: new Set(),
  recentEvents: [],
};

// Try to use Upstash Redis if credentials are provided
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
  }
}

export async function POST(request) {
  try {
    const { events } = await request.json();

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events array' }, { status: 400 });
    }

    console.log(`[Analytics API] Received ${events.length} events, first event:`, JSON.stringify(events[0], null, 2));

    // Store events in database for persistence
    const dbEvents = events.map(event => ({
      userId: event.userId,
      sessionId: event.sessionId,
      eventType: event.type,
      eventData: { ...event, type: undefined, userId: undefined, sessionId: undefined, pagePath: undefined },
      pagePath: event.pagePath,
    }));

    console.log(`[Analytics API] Transformed to dbEvents, first:`, JSON.stringify(dbEvents[0], null, 2));

    // Store in database (don't wait, fire and forget)
    storeBatchEvents(dbEvents)
      .then(result => {
        if (result.success) {
          console.log(`Successfully stored ${result.data?.length || dbEvents.length} events`);
        } else {
          console.error('Failed to store events:', result.error);
        }
      })
      .catch(error => {
        console.error('Failed to store events in database:', error);
      });

    // Update session info if we have device info
    if (events.length > 0 && events[0].userAgent) {
      const firstEvent = events[0];
      upsertUserSession({
        userId: firstEvent.userId,
        sessionId: firstEvent.sessionId,
        deviceInfo: {
          userAgent: firstEvent.userAgent,
          viewport: firstEvent.viewport,
          screen: firstEvent.screen,
          language: firstEvent.language,
        },
      }).catch(error => {
        console.error('Failed to update session:', error);
      });
    }

    // Process each event for Redis/memory aggregation
    for (const event of events) {
      await processEvent(event);
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to process events' }, { status: 500 });
  }
}

async function processEvent(event) {
  const { type, timestamp, sessionId, ...data } = event;

  if (redis) {
    // Store in Redis
    await processEventRedis(type, data, sessionId, timestamp);
  } else {
    // Store in memory (development fallback)
    processEventMemory(type, data, sessionId, timestamp);
  }
}

// Redis storage
async function processEventRedis(type, data, sessionId, timestamp) {
  try {
    // Increment total events
    await redis.incr('analytics:total_events');

    // Track unique sessions
    await redis.sadd('analytics:sessions', sessionId);

    // Store recent events (keep last 1000)
    await redis.lpush('analytics:recent', JSON.stringify({ type, ...data, timestamp }));
    await redis.ltrim('analytics:recent', 0, 999);

    // Type-specific processing
    if (type === 'answer') {
      const { skill, subject, difficulty, correct } = data;

      // Increment counters by skill
      await redis.hincrby('analytics:skills:total', skill, 1);
      if (correct) {
        await redis.hincrby('analytics:skills:correct', skill, 1);
      }

      // Increment counters by subject
      await redis.hincrby('analytics:subjects:total', subject, 1);
      if (correct) {
        await redis.hincrby('analytics:subjects:correct', subject, 1);
      }

      // Increment counters by difficulty
      await redis.hincrby('analytics:difficulty:total', difficulty, 1);
      if (correct) {
        await redis.hincrby('analytics:difficulty:correct', difficulty, 1);
      }
    } else if (type === 'feature') {
      const { feature, action } = data;
      await redis.hincrby('analytics:features', `${feature}:${action}`, 1);
    } else if (type === 'pageview') {
      await redis.hincrby('analytics:pageviews', data.page, 1);
    }
  } catch (error) {
    console.error('Redis error:', error);
    // Fall back to memory
    processEventMemory(type, data, sessionId, timestamp);
  }
}

// In-memory storage (fallback)
function processEventMemory(type, data, sessionId, timestamp) {
  inMemoryStore.totalEvents++;
  inMemoryStore.sessions.add(sessionId);

  // Store recent events (keep last 100)
  inMemoryStore.recentEvents.unshift({ type, ...data, timestamp });
  if (inMemoryStore.recentEvents.length > 100) {
    inMemoryStore.recentEvents = inMemoryStore.recentEvents.slice(0, 100);
  }

  // Type-specific processing
  if (type === 'answer') {
    const { skill, subject, difficulty, correct } = data;

    // Track by skill
    if (!inMemoryStore.skills[skill]) {
      inMemoryStore.skills[skill] = { total: 0, correct: 0 };
    }
    inMemoryStore.skills[skill].total++;
    if (correct) inMemoryStore.skills[skill].correct++;

    // Track answers
    if (!inMemoryStore.answers[subject]) {
      inMemoryStore.answers[subject] = { total: 0, correct: 0 };
    }
    inMemoryStore.answers[subject].total++;
    if (correct) inMemoryStore.answers[subject].correct++;
  } else if (type === 'feature') {
    const { feature, action } = data;
    const key = `${feature}:${action}`;
    inMemoryStore.features[key] = (inMemoryStore.features[key] || 0) + 1;
  }
}

// GET endpoint to retrieve stats (for admin dashboard)
export async function GET(request) {
  try {
    let stats;

    if (redis) {
      stats = await getStatsRedis();
    } else {
      stats = getStatsMemory();
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

async function getStatsRedis() {
  const [
    totalEvents,
    sessions,
    skillsTotal,
    skillsCorrect,
    subjectsTotal,
    subjectsCorrect,
    difficultyTotal,
    difficultyCorrect,
    features,
    recentEvents,
  ] = await Promise.all([
    redis.get('analytics:total_events'),
    redis.scard('analytics:sessions'),
    redis.hgetall('analytics:skills:total'),
    redis.hgetall('analytics:skills:correct'),
    redis.hgetall('analytics:subjects:total'),
    redis.hgetall('analytics:subjects:correct'),
    redis.hgetall('analytics:difficulty:total'),
    redis.hgetall('analytics:difficulty:correct'),
    redis.hgetall('analytics:features'),
    redis.lrange('analytics:recent', 0, 49),
  ]);

  // Calculate accuracy by skill
  const skills = {};
  for (const [skill, total] of Object.entries(skillsTotal || {})) {
    const correct = skillsCorrect?.[skill] || 0;
    skills[skill] = {
      total: parseInt(total),
      correct: parseInt(correct),
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  }

  // Calculate accuracy by subject
  const subjects = {};
  for (const [subject, total] of Object.entries(subjectsTotal || {})) {
    const correct = subjectsCorrect?.[subject] || 0;
    subjects[subject] = {
      total: parseInt(total),
      correct: parseInt(correct),
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  }

  // Parse recent events
  const recent = recentEvents.map(e => {
    try {
      return JSON.parse(e);
    } catch {
      return null;
    }
  }).filter(Boolean);

  return {
    totalEvents: parseInt(totalEvents) || 0,
    uniqueSessions: sessions || 0,
    skills,
    subjects,
    features: features || {},
    recentEvents: recent,
  };
}

function getStatsMemory() {
  // Calculate accuracy by skill
  const skills = {};
  for (const [skill, data] of Object.entries(inMemoryStore.skills)) {
    skills[skill] = {
      ...data,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    };
  }

  // Calculate accuracy by subject
  const subjects = {};
  for (const [subject, data] of Object.entries(inMemoryStore.answers)) {
    subjects[subject] = {
      ...data,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    };
  }

  return {
    totalEvents: inMemoryStore.totalEvents,
    uniqueSessions: inMemoryStore.sessions.size,
    skills,
    subjects,
    features: inMemoryStore.features,
    recentEvents: inMemoryStore.recentEvents.slice(0, 50),
  };
}
