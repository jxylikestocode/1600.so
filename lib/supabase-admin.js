/**
 * Supabase Admin Client
 *
 * Simple server-side client for admin operations like analytics
 * Uses service role key for full database access
 */

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify the client has the necessary methods
  if (typeof client.from !== 'function') {
    console.error('Created client:', client);
    throw new Error('Supabase client is invalid - missing .from() method');
  }

  return client;
}
