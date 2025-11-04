/**
 * Backfill Domain Data Script
 *
 * This script updates existing user_answers records to include domain information.
 * It reads all questions from the JSON files and updates the database.
 *
 * Usage: node scripts/backfill-domains.js
 */

import { createClient } from '@supabase/supabase-js';
import { getAllQuestions } from '../lib/data.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillDomains() {
  console.log('🚀 Starting domain backfill...\n');

  try {
    // 1. Load all questions
    console.log('📚 Loading questions from JSON files...');
    const questions = await getAllQuestions();
    console.log(`✅ Loaded ${questions.length} questions\n`);

    // 2. Create a map of questionId -> domain
    const questionDomainMap = new Map();
    questions.forEach(q => {
      if (q.primary_class_cd_desc) {
        questionDomainMap.set(q.questionId, q.primary_class_cd_desc);
      }
    });
    console.log(`📊 Found domain info for ${questionDomainMap.size} questions\n`);

    // 3. Get all distinct question IDs from user_answers that have NULL domain
    console.log('🔍 Finding user_answers with NULL domain...');
    const { data: answersNeedingUpdate, error: queryError } = await supabase
      .from('user_answers')
      .select('question_id')
      .is('question_domain', null);

    if (queryError) {
      throw new Error(`Failed to query user_answers: ${queryError.message}`);
    }

    // Get unique question IDs
    const uniqueQuestionIds = [...new Set(answersNeedingUpdate.map(a => a.question_id))];
    console.log(`📝 Found ${answersNeedingUpdate.length} total answers from ${uniqueQuestionIds.length} unique questions\n`);

    if (uniqueQuestionIds.length === 0) {
      console.log('✨ No records need updating. All done!');
      return;
    }

    // 4. Build the update array
    const updates = [];
    let foundCount = 0;
    let missingCount = 0;

    uniqueQuestionIds.forEach(qId => {
      const domain = questionDomainMap.get(qId);
      if (domain) {
        updates.push({ questionId: qId, domain });
        foundCount++;
      } else {
        missingCount++;
        console.log(`⚠️  Warning: No domain found for question ${qId}`);
      }
    });

    console.log(`\n📈 Statistics:`);
    console.log(`   - Questions with domain: ${foundCount}`);
    console.log(`   - Questions missing domain: ${missingCount}\n`);

    if (updates.length === 0) {
      console.log('❌ No updates to perform');
      return;
    }

    // 5. Perform bulk update using RPC function
    console.log(`🔄 Updating ${updates.length} question domains...`);

    // Update in batches of 100 to avoid payload size issues
    const batchSize = 100;
    let totalUpdated = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(updates.length / batchSize)}...`);

      const { data, error } = await supabase
        .rpc('bulk_update_question_domains', { question_domains: batch });

      if (error) {
        console.error(`❌ Error updating batch: ${error.message}`);
        continue;
      }

      if (data && Array.isArray(data)) {
        const batchTotal = data.reduce((sum, row) => sum + (row.updated_count || 0), 0);
        totalUpdated += batchTotal;
        console.log(`   ✅ Updated ${batchTotal} records in this batch`);
      }
    }

    console.log(`\n✨ Backfill complete!`);
    console.log(`   Total user_answer records updated: ${totalUpdated}`);

  } catch (error) {
    console.error('\n❌ Error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillDomains()
  .then(() => {
    console.log('\n👍 Script finished successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
