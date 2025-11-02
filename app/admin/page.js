"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <div className="text-2xl font-bold text-gray-900 mb-2 animate-pulse">Loading...</div>
          <div className="text-gray-600">Fetching analytics data</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button onClick={fetchStats}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalQuestions = stats?.skills
    ? Object.values(stats.skills).reduce((sum, skill) => sum + skill.total, 0)
    : 0;

  const totalCorrect = stats?.skills
    ? Object.values(stats.skills).reduce((sum, skill) => sum + skill.correct, 0)
    : 0;

  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time user behavior tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
              >
                {autoRefresh ? "⟳ Auto-refresh" : "Paused"}
              </Button>
              <Button onClick={fetchStats} size="sm" variant="outline">
                Refresh Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Events</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalEvents || 0}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Unique Sessions</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.uniqueSessions || 0}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Questions Answered</div>
            <div className="text-3xl font-bold text-gray-900">{totalQuestions}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">Overall Accuracy</div>
            <div className="text-3xl font-bold text-green-600">{overallAccuracy.toFixed(1)}%</div>
          </Card>
        </div>

        {/* Subject Performance */}
        {stats?.subjects && Object.keys(stats.subjects).length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Subject</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stats.subjects).map(([subject, data]) => (
                <div key={subject} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900 capitalize">{subject}</div>
                    <div className="text-sm text-gray-600">
                      {data.correct} / {data.total} correct
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {data.accuracy.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Skills Breakdown */}
        {stats?.skills && Object.keys(stats.skills).length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance by Skill</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Skill</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Attempts</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Correct</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.skills)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .map(([skill, data]) => (
                      <tr key={skill} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{skill}</td>
                        <td className="py-3 px-4 text-center text-gray-700">{data.total}</td>
                        <td className="py-3 px-4 text-center text-gray-700">{data.correct}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={
                              data.accuracy >= 70
                                ? "bg-green-100 text-green-800"
                                : data.accuracy >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {data.accuracy.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Feature Usage */}
        {stats?.features && Object.keys(stats.features).length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Feature Usage</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.features).map(([feature, count]) => (
                <div key={feature} className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-600 capitalize">
                    {feature.replace(':', ' - ')}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{count}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        {stats?.recentEvents && stats.recentEvents.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {stats.recentEvents.slice(0, 20).map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-3">
                    {event.type === 'answer' && (
                      <>
                        <Badge className={event.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {event.correct ? "✓" : "✗"}
                        </Badge>
                        <span className="text-gray-700">{event.skill}</span>
                        <Badge variant="outline" className="text-xs">
                          {event.difficulty}
                        </Badge>
                        <span className="text-gray-500 text-xs">
                          {event.timeSpent}s
                        </span>
                      </>
                    )}
                    {event.type === 'feature' && (
                      <>
                        <Badge className="bg-blue-100 text-blue-800">Feature</Badge>
                        <span className="text-gray-700">
                          {event.feature}: {event.action}
                        </span>
                      </>
                    )}
                    {event.type !== 'answer' && event.type !== 'feature' && (
                      <>
                        <Badge variant="outline">{event.type}</Badge>
                        <span className="text-gray-700">{JSON.stringify(event)}</span>
                      </>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {stats && stats.totalEvents === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">No Data Yet</div>
            <div className="text-gray-600">
              Start answering questions to see analytics appear here!
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
