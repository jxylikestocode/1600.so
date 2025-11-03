'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  formatEventAsNaturalLanguage,
  formatDateTime,
  formatTime,
  formatDuration,
  formatTimeGap,
  formatDeviceInfo,
  formatLocation,
  extractPageFlow,
  getEventIcon,
} from '@/lib/journey-utils';

export default function UserJourneyPage() {
  const params = useParams();
  const userId = params.userId;

  const [sessions, setSessions] = useState([]);
  const [questionDetails, setQuestionDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showRawData, setShowRawData] = useState(false);
  const [collapsedSessions, setCollapsedSessions] = useState({});
  const [pageFlow, setPageFlow] = useState({ flow: [], transitions: [] });

  useEffect(() => {
    if (userId) {
      fetchJourney();
    }
  }, [userId]);

  const fetchJourney = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/journey`);
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions || []);
        setQuestionDetails(data.questionDetails || {});

        // Extract page flow from all events
        if (data.events && data.events.length > 0) {
          const flow = extractPageFlow(data.events);
          setPageFlow(flow);
        }
      } else {
        setError(data.error || 'Failed to fetch user journey');
      }
    } catch (err) {
      setError('Failed to fetch user journey');
      console.error('Error fetching journey:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = (sessionId) => {
    setCollapsedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const getFilteredSessions = () => {
    if (filterType === 'all') {
      return sessions;
    }

    return sessions.map(session => ({
      ...session,
      events: session.events.filter(e => e.event_type === filterType)
    })).filter(session => session.events.length > 0);
  };

  const getTotalEvents = () => {
    return sessions.reduce((sum, session) => sum + session.eventCount, 0);
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'pageview': return 'border-l-blue-400';
      case 'answer': return 'border-l-green-400';
      case 'filter': return 'border-l-purple-400';
      case 'auth': return 'border-l-orange-400';
      case 'navigation': return 'border-l-gray-400';
      case 'feature': return 'border-l-pink-400';
      case 'bookmark': return 'border-l-yellow-400';
      default: return 'border-l-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredSessions = getFilteredSessions();
  const allEventTypes = sessions.length > 0
    ? ['all', ...new Set(sessions.flatMap(s => s.events.map(e => e.event_type)))]
    : ['all'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to all users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">User Journey</h1>
          <p className="text-gray-600 mt-2">
            {userId.startsWith('anon_') ? 'Anonymous user' : 'Authenticated user'}
          </p>
          <p className="text-sm text-gray-500 font-mono mt-1">{userId}</p>
        </div>

        {/* Page Flow Visualization */}
        {pageFlow.flow.length > 1 && (
          <div className="mb-6 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">📍 Navigation Flow</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {pageFlow.flow.map((page, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                    {page}
                  </div>
                  {index < pageFlow.flow.length - 1 && (
                    <span className="text-gray-400">→</span>
                  )}
                </div>
              ))}
            </div>

            {/* Most common transitions */}
            {pageFlow.transitions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-600 mb-2">Most Common Transitions:</p>
                <div className="space-y-1">
                  {pageFlow.transitions.slice(0, 5).map((transition, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-700">{transition.path}</span>
                      <span className="text-xs text-gray-500">({transition.count}×)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap items-center">
          <div className="flex gap-2 flex-wrap flex-1">
            {allEventTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {type === 'all' ? 'All Events' : type}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowRawData(!showRawData)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showRawData
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {showRawData ? '📋 Hide Raw Data' : '📋 Show Raw Data'}
          </button>
        </div>

        {/* Sessions Timeline */}
        <div className="space-y-6">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No events found</p>
            </div>
          ) : (
            filteredSessions.map((session, sessionIndex) => {
              const isCollapsed = collapsedSessions[session.sessionId];
              const sessionInfo = session.sessionInfo;

              return (
                <div key={session.sessionId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Session Header */}
                  <div
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                    onClick={() => toggleSession(session.sessionId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            📅 Session {sessionIndex + 1}
                          </h3>
                          <span className="text-sm text-gray-600">
                            {formatDateTime(session.firstEvent)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                          {sessionInfo && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">Device:</span>
                                <span>{formatDeviceInfo(sessionInfo.device_info)}</span>
                              </div>
                              {sessionInfo.device_info?.ip && (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">IP:</span>
                                  <span className="font-mono text-xs">{sessionInfo.device_info.ip}</span>
                                </div>
                              )}
                              {sessionInfo.device_info?.location && (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium">📍 Location:</span>
                                  <span>{formatLocation(sessionInfo.device_info.location)}</span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">Duration:</span>
                            <span>{formatDuration(session.durationSeconds)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">Events:</span>
                            <span>{session.eventCount}</span>
                          </div>
                        </div>
                      </div>

                      <button className="text-gray-500 hover:text-gray-700 p-1">
                        {isCollapsed ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Session Events */}
                  {!isCollapsed && (
                    <div className="p-4">
                      <div className="space-y-3">
                        {session.events.map((event, eventIndex) => {
                          const naturalLanguage = formatEventAsNaturalLanguage(event, questionDetails);
                          const showTimeGap = event.timeGapSeconds && event.timeGapSeconds > 120; // Show gaps > 2 minutes

                          return (
                            <div key={event.id}>
                              {/* Time Gap Indicator */}
                              {showTimeGap && (
                                <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                                  <div className="flex-1 border-t border-dashed border-gray-300"></div>
                                  <span className="px-2">⏱️ {formatTimeGap(event.timeGapSeconds)}</span>
                                  <div className="flex-1 border-t border-dashed border-gray-300"></div>
                                </div>
                              )}

                              {/* Event Card */}
                              <div className={`border-l-4 ${getEventColor(event.event_type)} bg-gray-50 rounded-r-lg p-4`}>
                                <div className="flex items-start gap-3">
                                  {/* Icon */}
                                  <div className="text-xl flex-shrink-0 mt-0.5">
                                    {getEventIcon(event.event_type)}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                      <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-line">
                                        {naturalLanguage}
                                      </p>
                                      <div className="flex-shrink-0 text-right">
                                        <p className="text-xs text-gray-500">
                                          {formatTime(event.created_at)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          #{event.sequence_number}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Raw Data */}
                                    {showRawData && (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto font-mono">
                                          {JSON.stringify(event, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {sessions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">📊 Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{getTotalEvents()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">First Activity</p>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateTime(sessions[0]?.firstEvent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="text-sm font-medium text-gray-700">
                  {formatDateTime(sessions[sessions.length - 1]?.lastEvent)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
