'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { testSupabaseConnection } from '@/lib/supabase/test-connection';

export default function TestSupabasePage() {
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const runTest = async () => {
    setIsRunning(true);
    setLogs([]);
    setTestResult(null);

    // Capture console.log
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      setLogs(prev => [...prev, { type: 'log', message: args.join(' ') }]);
      originalLog(...args);
    };

    console.error = (...args) => {
      setLogs(prev => [...prev, { type: 'error', message: args.join(' ') }]);
      originalError(...args);
    };

    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult(false);
      setLogs(prev => [...prev, { type: 'error', message: error.message }]);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Supabase Connection Test</h1>
        <p className="text-gray-600 mb-8">
          Verify your Supabase setup is working correctly
        </p>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Test Configuration</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-gray-600">URL:</span>{' '}
              <span className="text-blue-600">
                {process.env.NEXT_PUBLIC_SUPABASE_URL}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Anon Key:</span>{' '}
              <span className="text-green-600">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)}...
              </span>
            </div>
          </div>

          <Button
            onClick={runTest}
            disabled={isRunning}
            className="mt-6"
            size="lg"
          >
            {isRunning ? 'Running Tests...' : 'Run Connection Test'}
          </Button>
        </Card>

        {testResult !== null && (
          <Card className={`p-6 mb-6 ${testResult ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <h2 className="text-xl font-bold mb-2">
              {testResult ? '✅ All Tests Passed!' : '❌ Tests Failed'}
            </h2>
            <p className="text-gray-700">
              {testResult
                ? 'Your Supabase connection is working correctly. You can now proceed with authentication setup!'
                : 'There was an issue with your Supabase setup. Check the logs below for details.'}
            </p>
          </Card>
        )}

        {logs.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Test Logs</h2>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-auto max-h-96">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`mb-1 ${log.type === 'error' ? 'text-red-400' : 'text-gray-100'}`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold mb-2">Haven't run the SQL scripts yet?</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Go to your Supabase Dashboard → SQL Editor</li>
            <li>
              Copy contents of <code className="bg-white px-1 py-0.5 rounded">supabase/schema.sql</code> and run it
            </li>
            <li>
              Copy contents of <code className="bg-white px-1 py-0.5 rounded">supabase/rls-policies.sql</code> and run it
            </li>
            <li>Come back here and click "Run Connection Test"</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
