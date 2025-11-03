'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function UserJourneyPage() {
  const params = useParams();
  const userId = params.userId;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'pageview', 'answer', 'filter', 'auth'
  const [showRawData, setShowRawData] = useState(false);

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
        setEvents(data.events || []);
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

  const filteredEvents = filterType === 'all'
    ? events
    : events.filter(e => e.event_type === filterType);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'pageview': return '👁️';
      case 'answer': return '✍️';
      case 'filter': return '🔍';
      case 'auth': return '🔐';
      case 'navigation': return '🧭';
      case 'feature': return '⚡';
      default: return '📝';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'pageview': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'answer': return 'bg-green-50 border-green-200 text-green-800';
      case 'filter': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'auth': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'navigation': return 'bg-gray-50 border-gray-200 text-gray-800';
      case 'feature': return 'bg-pink-50 border-pink-200 text-pink-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const renderEventDetails = (event) => {
    const data = event.event_data || {};

    switch (event.event_type) {
      case 'pageview':
        return (
          <div>
            <p className="font-medium">Viewed: {event.page_path}</p>
          </div>
        );

      case 'answer':
        return (
          <div>
            <p className="font-medium">Question: {data.questionId?.substring(0, 8) || 'Unknown'}</p>
            <p className="text-sm">
              Answered: <span className={data.correct ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {data.selectedAnswer} {data.correct ? '✓' : '✗'}
              </span>
            </p>
            {data.correct !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                Correct answer: {data.correctAnswer}
              </p>
            )}
          </div>
        );

      case 'filter':
        return (
          <div>
            <p className="font-medium">Changed filter: {data.filterType || 'Unknown'}</p>
            <p className="text-sm">Value: {data.value || 'N/A'}</p>
          </div>
        );

      case 'auth':
        return (
          <div>
            <p className="font-medium">Auth action: {data.action || 'Unknown'}</p>
            {data.provider && <p className="text-sm">Provider: {data.provider}</p>}
          </div>
        );

      case 'navigation':
        return (
          <div>
            <p className="font-medium">{data.action || 'Navigation'}</p>
            {data.from && <p className="text-sm">From: {data.from}</p>}
            {data.to && <p className="text-sm">To: {data.to}</p>}
          </div>
        );

      default:
        return (
          <div>
            <p className="font-medium">{event.event_type}</p>
            {Object.keys(data).length > 0 && (
              <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const eventTypes = ['all', ...new Set(events.map(e => e.event_type))];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
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

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap items-center">
          <div className="flex gap-2 flex-wrap flex-1">
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {type === 'all' ? 'All Events' : type}
                <span className="ml-2 text-xs opacity-75">
                  ({type === 'all' ? events.length : events.filter(e => e.event_type === type).length})
                </span>
              </button>
            ))}
          </div>

          {/* Raw Data Toggle */}
          <button
            onClick={() => setShowRawData(!showRawData)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showRawData
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {showRawData ? '📋 Hide Raw Data' : '📋 Show Raw Data'}
          </button>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No events found</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={`bg-white rounded-lg border-l-4 p-6 shadow-sm ${getEventColor(event.event_type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-2xl">{getEventIcon(event.event_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {event.event_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          #{event.sequence_number}
                        </span>
                      </div>
                      {renderEventDetails(event)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDate(event.created_at)}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {event.session_id?.substring(0, 15)}...
                    </p>
                  </div>
                </div>

                {/* Raw Data Section */}
                {showRawData && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">RAW EVENT DATA:</p>
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto font-mono">
                      {JSON.stringify(event, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {events.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl font-bold">
                  {new Set(events.map(e => e.session_id)).size}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">First Activity</p>
                <p className="text-sm font-medium">
                  {formatDate(events[events.length - 1]?.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="text-sm font-medium">
                  {formatDate(events[0]?.created_at)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
