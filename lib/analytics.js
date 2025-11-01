/**
 * Analytics Client
 *
 * Tracks user behavior anonymously and sends to backend in batches
 * Non-blocking - never interferes with UI performance
 */

// Event queue for batching
let eventQueue = [];
let flushTimer = null;

// Configuration
const BATCH_SIZE = 10; // Send after 10 events
const FLUSH_INTERVAL = 30000; // Or every 30 seconds
const ENDPOINT = '/api/analytics';

/**
 * Track an analytics event
 * Events are batched and sent asynchronously
 */
export function trackEvent(type, data) {
  // Skip if window not available (SSR)
  if (typeof window === 'undefined') return;

  const event = {
    type,
    ...data,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  };

  eventQueue.push(event);

  // Send if batch is full
  if (eventQueue.length >= BATCH_SIZE) {
    flush();
  } else {
    // Schedule flush if not already scheduled
    if (!flushTimer) {
      flushTimer = setTimeout(flush, FLUSH_INTERVAL);
    }
  }
}

/**
 * Flush the event queue (send to server)
 */
function flush() {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  // Clear timer
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Send to server (fire and forget)
  fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ events }),
    keepalive: true, // Send even if page closes
  }).catch((error) => {
    // Silently fail - don't block user experience
    console.error('Analytics error:', error);
  });
}

/**
 * Get or create a session ID
 * Stored in sessionStorage - unique per browser tab
 */
function getSessionId() {
  if (typeof window === 'undefined') return 'unknown';

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track answer attempt
 */
export function trackAnswer(questionId, skill, subject, difficulty, correct, timeSpent) {
  trackEvent('answer', {
    questionId,
    skill,
    subject,
    difficulty,
    correct,
    timeSpent,
  });
}

/**
 * Track navigation
 */
export function trackNavigation(from, to, method) {
  trackEvent('navigation', {
    from,
    to,
    method, // 'next', 'prev', 'jump', 'grid'
  });
}

/**
 * Track feature usage
 */
export function trackFeature(feature, action) {
  trackEvent('feature', {
    feature, // 'calculator', 'reference', 'elimination', etc.
    action, // 'open', 'close', 'use', etc.
  });
}

/**
 * Track filter changes
 */
export function trackFilter(filterType, value) {
  trackEvent('filter', {
    filterType, // 'difficulty', 'skill', 'subject', etc.
    value,
  });
}

/**
 * Track page view
 */
export function trackPageView(page, metadata = {}) {
  trackEvent('pageview', {
    page,
    ...metadata,
  });
}

// Set up auto-flush on page unload
if (typeof window !== 'undefined') {
  // Flush before page unload
  window.addEventListener('beforeunload', flush);

  // Flush periodically
  setInterval(flush, FLUSH_INTERVAL);

  // Track initial page view
  if (document.readyState === 'complete') {
    trackPageView(window.location.pathname);
  } else {
    window.addEventListener('load', () => {
      trackPageView(window.location.pathname);
    });
  }
}

/**
 * Manually flush events (for testing)
 */
export function forceFlush() {
  flush();
}
