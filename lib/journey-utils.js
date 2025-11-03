/**
 * Utility functions for formatting and processing user journey data
 */

/**
 * Format event as natural language description
 * @param {Object} event - The event object
 * @param {Object} questionDetails - Map of questionId to question details
 */
export function formatEventAsNaturalLanguage(event, questionDetails = {}) {
  const { event_type, event_data, page_path } = event;

  switch (event_type) {
    case 'pageview':
      return formatPageview(page_path, event_data, questionDetails);

    case 'answer':
      return formatAnswer(event_data, questionDetails);

    case 'navigation':
      return formatNavigation(event_data);

    case 'filter':
      return formatFilter(event_data);

    case 'auth':
      return formatAuth(event_data);

    case 'feature':
      return formatFeature(event_data);

    case 'bookmark':
      return formatBookmark(event_data, questionDetails);

    default:
      return `User triggered ${event_type} event`;
  }
}

function formatPageview(pagePath, data, questionDetails) {
  // Extract page name from path
  if (pagePath === '/') {
    return 'User visited Home page';
  }

  if (pagePath.startsWith('/question/')) {
    const questionIdFull = pagePath.split('/')[2]?.split('?')[0];
    const questionIdShort = questionIdFull?.substring(0, 8);

    // Try to get full question details from the lookup
    const question = questionDetails?.[questionIdFull];

    if (question) {
      // We have full question details from JSON
      const subject = question.subject === 'math' ? 'Math' : 'Reading & Writing';
      const difficulty = formatDifficulty(question.difficulty);
      const questionType = question.detail?.type === 'spr' ? 'SPR' : 'MCQ';

      return `User viewed ${subject} question #${questionIdShort} (${question.primary_class_cd_desc} • ${question.skill_desc} • ${difficulty} • ${questionType})`;
    }

    // Fallback to event_data if available
    if (data?.subject && data?.skill) {
      const subject = data.subject === 'math' ? 'Math' : 'Reading & Writing';
      const difficulty = data.difficulty ? formatDifficulty(data.difficulty) : '';
      return `User viewed ${subject} question ${questionIdShort ? `#${questionIdShort}` : ''} (${data.skill}${difficulty ? ', ' + difficulty : ''})`;
    }

    return `User viewed question ${questionIdShort ? `#${questionIdShort}` : ''}`;
  }

  if (pagePath === '/review') {
    return 'User visited Review page';
  }

  if (pagePath.startsWith('/admin')) {
    return `User visited Admin ${pagePath.split('/')[2] || 'page'}`;
  }

  return `User visited ${pagePath}`;
}

function formatAnswer(data, questionDetails) {
  const {
    questionId,
    correct,
    skill,
    subject,
    difficulty,
    timeSpent,
  } = data;

  const questionIdShort = questionId?.substring(0, 8);
  const outcome = correct ? '✅ correctly' : '❌ incorrectly';
  const timeFormatted = formatDuration(timeSpent);

  // Try to get full question details
  const question = questionDetails?.[questionId];

  if (question) {
    // We have full question details from JSON
    const subjectName = question.subject === 'math' ? 'Math' : 'Reading & Writing';
    const difficultyName = formatDifficulty(question.difficulty);
    const questionType = question.detail?.type === 'spr' ? 'SPR' : 'MCQ';
    const scoreBand = question.score_band_range_cd;

    let description = `User answered ${subjectName} question #${questionIdShort} ${outcome}`;

    if (timeSpent) {
      description += ` after ${timeFormatted}`;
    }

    // Add detailed metadata on new line
    description += `\n📊 ${question.primary_class_cd_desc} • ${question.skill_desc} • ${difficultyName} (Band ${scoreBand}) • ${questionType}`;

    return description;
  }

  // Fallback to event data
  const subjectName = subject === 'math' ? 'Math' : 'Reading & Writing';
  const difficultyName = formatDifficulty(difficulty);

  let description = `User answered ${subjectName} question #${questionIdShort} ${outcome}`;

  if (skill || difficultyName) {
    description += ` (${[skill, difficultyName].filter(Boolean).join(', ')})`;
  }

  if (timeSpent) {
    description += ` after ${timeFormatted}`;
  }

  return description;
}

function formatNavigation(data) {
  const { from, to, method } = data;

  const methodText = {
    'next': 'via Next button',
    'prev': 'via Previous button',
    'jump': 'by jumping',
    'grid': 'from question grid',
    'link': 'via link',
  }[method] || '';

  return `User navigated from ${formatPath(from)} to ${formatPath(to)}${methodText ? ' ' + methodText : ''}`;
}

function formatFilter(data) {
  const { filterType, value } = data;

  const filterName = filterType
    ?.replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase() || 'filter';

  return `User filtered by ${filterName}: "${value}"`;
}

function formatAuth(data) {
  const { action, provider } = data;

  const actionText = {
    'signup': 'signed up',
    'login': 'logged in',
    'logout': 'logged out',
    'upgrade': 'linked anonymous account to authenticated account',
  }[action] || action;

  if (provider) {
    return `User ${actionText} with ${provider}`;
  }

  return `User ${actionText}`;
}

function formatFeature(data) {
  const { feature, action } = data;

  const featureName = feature
    ?.replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim() || 'feature';

  const actionText = {
    'open': 'opened',
    'close': 'closed',
    'enable': 'enabled',
    'disable': 'disabled',
    'use': 'used',
  }[action] || action || 'interacted with';

  return `User ${actionText} ${featureName}`;
}

function formatBookmark(data, questionDetails) {
  const { questionId, action } = data;
  const questionIdShort = questionId?.substring(0, 8);
  const actionText = action === 'add' ? 'bookmarked' : 'unbookmarked';

  // Try to get full question details
  const question = questionDetails?.[questionId];

  if (question) {
    const subject = question.subject === 'math' ? 'Math' : 'Reading & Writing';
    return `User ${actionText} ${subject} question #${questionIdShort} (${question.skill_desc})`;
  }

  return `User ${actionText} question #${questionIdShort}`;
}

function formatPath(path) {
  if (!path) return 'unknown';
  if (path === '/') return 'Home';
  if (path.startsWith('/question/')) return 'Question';
  if (path === '/review') return 'Review';
  if (path.startsWith('/admin')) return 'Admin';
  return path;
}

/**
 * Format difficulty code to readable name
 */
export function formatDifficulty(difficulty) {
  const map = {
    'E': 'Easy',
    'M': 'Medium',
    'H': 'Hard',
  };
  return map[difficulty] || difficulty;
}

/**
 * Format duration in seconds to readable format
 */
export function formatDuration(seconds) {
  if (!seconds) return '';

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

/**
 * Format time gap as natural language
 */
export function formatTimeGap(seconds) {
  if (seconds < 2) return null; // Don't show very small gaps

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} later`;
  }

  if (seconds < 120) {
    return '1 minute later';
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minutes later`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m later`
      : `${hours} hour${hours !== 1 ? 's' : ''} later`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} later`;
}

/**
 * Format timestamp to readable date and time
 */
export function formatDateTime(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format time only (no date)
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get icon for event type
 */
export function getEventIcon(eventType) {
  const icons = {
    'pageview': '👁️',
    'answer': '✏️',
    'navigation': '🧭',
    'filter': '🔍',
    'auth': '🔐',
    'feature': '⚙️',
    'bookmark': '🔖',
  };

  return icons[eventType] || '📌';
}

/**
 * Extract page flow from events
 */
export function extractPageFlow(events) {
  const flow = [];
  const transitions = {};

  events.forEach((event, index) => {
    if (event.event_type === 'pageview') {
      const from = index > 0 && events[index - 1].event_type === 'pageview'
        ? simplifyPath(events[index - 1].page_path)
        : null;
      const to = simplifyPath(event.page_path);

      if (from && to && from !== to) {
        const key = `${from} → ${to}`;
        transitions[key] = (transitions[key] || 0) + 1;
      }

      // Add to flow if not duplicate of last
      if (flow.length === 0 || flow[flow.length - 1] !== to) {
        flow.push(to);
      }
    }
  });

  return {
    flow,
    transitions: Object.entries(transitions).map(([path, count]) => ({
      path,
      count,
    })).sort((a, b) => b.count - a.count),
  };
}

function simplifyPath(path) {
  if (!path) return 'Unknown';
  if (path === '/') return 'Home';
  if (path.startsWith('/question/')) return 'Question';
  if (path === '/review') return 'Review';
  if (path.startsWith('/admin/users/') && path.split('/').length > 3) return 'User Details';
  if (path === '/admin/users') return 'User List';
  if (path.startsWith('/admin')) return 'Admin';
  return path;
}

/**
 * Get device information as readable string
 */
export function formatDeviceInfo(deviceInfo) {
  if (!deviceInfo) return 'Unknown device';

  const { userAgent, viewport, screen } = deviceInfo;

  // Extract browser and OS from user agent
  let browser = 'Unknown browser';
  let os = 'Unknown OS';

  if (userAgent) {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge';
    }

    if (userAgent.includes('Mac OS')) {
      os = 'macOS';
    } else if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    }
  }

  const viewportSize = viewport
    ? `${viewport.width}×${viewport.height}`
    : 'unknown size';

  return `${browser} on ${os}, ${viewportSize}`;
}
