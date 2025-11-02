'use client';

import { useEffect } from 'react';
import { trackPageView, forceFlush } from '@/lib/analytics';

export default function TestAnalytics() {
  useEffect(() => {
    // Track a test event
    trackPageView('/test-analytics', { test: true });

    // Force flush after 2 seconds
    setTimeout(() => {
      console.log('Forcing analytics flush...');
      forceFlush();
    }, 2000);
  }, []);

  const handleManualFlush = () => {
    console.log('Manual flush triggered');
    trackPageView('/test-manual', { manual: true });
    forceFlush();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Analytics Test Page</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open browser console (F12)</li>
            <li>Check Network tab for POST to /api/analytics</li>
            <li>Click the button below to manually send events</li>
            <li>Check server terminal for "Successfully stored X events"</li>
          </ol>
        </div>

        <button
          onClick={handleManualFlush}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Send Test Analytics Event
        </button>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Check your browser console and network tab to see if events are being sent.
            Check your server terminal for database errors.
          </p>
        </div>
      </div>
    </div>
  );
}
