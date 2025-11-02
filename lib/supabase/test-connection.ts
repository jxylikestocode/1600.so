/**
 * Test Supabase Connection
 *
 * Run this to verify your Supabase setup is working correctly
 */

import { getSupabaseClient } from './client';

export async function testSupabaseConnection() {
  const supabase = getSupabaseClient();

  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    // Test 1: Check if we can connect
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Connection test failed:', healthError.message);

      if (healthError.message.includes('relation') || healthError.message.includes('does not exist')) {
        console.log('💡 Hint: Run the SQL scripts in Supabase Dashboard → SQL Editor');
        console.log('   1. Run supabase/schema.sql first');
        console.log('   2. Then run supabase/rls-policies.sql');
      }

      return false;
    }

    console.log('✅ Connection successful!');

    // Test 2: Try to create a temporary user
    console.log('\n🧪 Testing temporary user creation...');
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ is_temporary: true })
      .select()
      .single();

    if (insertError) {
      console.error('❌ User creation failed:', insertError.message);

      if (insertError.message.includes('policy')) {
        console.log('💡 Hint: Run supabase/rls-policies.sql in Supabase Dashboard');
      }

      return false;
    }

    console.log('✅ Temporary user created successfully!');
    console.log('   User ID:', newUser.id);

    // Test 3: Verify we can read the user back
    console.log('\n🔎 Testing user retrieval...');
    const { data: readUser, error: readError } = await supabase
      .from('users')
      .select('*')
      .eq('id', newUser.id)
      .single();

    if (readError) {
      console.error('❌ User retrieval failed:', readError.message);
      return false;
    }

    console.log('✅ User retrieval successful!');
    console.log('   Is temporary:', readUser.is_temporary);

    // Cleanup: Delete test user
    await supabase.from('users').delete().eq('id', newUser.id);
    console.log('🧹 Test user cleaned up');

    console.log('\n🎉 All tests passed! Your Supabase is ready to use!');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}
