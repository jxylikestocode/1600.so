# Fix for "Unknown" Domains in Skill Breakdown

## Problem
After implementing hierarchical skill breakdown (Subject → Domain → Skills), all domains are showing as "Unknown" because:

1. ✅ The `question_domain` column exists in database (already added)
2. ❌ Existing user_answers records have NULL domain values
3. ❌ The question-viewer component wasn't passing `primary_class_cd_desc` when saving answers

## Solution Overview

### 1. Fixed Code (Already Done)
- **File**: `components/question-viewer.jsx`
- **Change**: Added `primary_class_cd_desc` to the metadata passed to `saveAnswer()`
- **Result**: New answers will now save domain correctly

### 2. Database Migration (Need to Run)
**File**: `supabase/migrations/011_backfill_domain_data.sql`

**Steps to apply:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qvurrlbgbpeywggoxtid/sql/new
2. Copy the contents of `supabase/migrations/011_backfill_domain_data.sql`
3. Paste into the SQL Editor
4. Click "Run"

This creates helper functions for bulk updating domain data.

### 3. Backfill Existing Data (Need to Run)
**Script**: `scripts/backfill-domains.js`

**What it does:**
- Reads all questions from JSON files
- Finds all user_answers with NULL domain
- Updates them with the correct domain from question data

**How to run:**
```bash
npm run backfill:domains
```

**Expected output:**
```
🚀 Starting domain backfill...

📚 Loading questions from JSON files...
✅ Loaded 1369 questions

📊 Found domain info for 1369 questions

🔍 Finding user_answers with NULL domain...
📝 Found X total answers from Y unique questions

📈 Statistics:
   - Questions with domain: Y
   - Questions missing domain: 0

🔄 Updating Y question domains...
   Processing batch 1/Z...
   ✅ Updated X records in this batch

✨ Backfill complete!
   Total user_answer records updated: X

👍 Script finished successfully
```

## Verification

After running the migration and backfill script:

1. **Test New Answers**: Answer a new question and check if it saves with domain
2. **Check Stats Page**: Go to `/stats` and verify domains show correctly (e.g., "Algebra", "Geometry", "Information and Ideas")
3. **Verify Database**: Run this query in Supabase SQL Editor:
   ```sql
   SELECT
     question_domain,
     COUNT(*) as count
   FROM user_answers
   GROUP BY question_domain
   ORDER BY count DESC;
   ```
   You should see domains like "Algebra", "Geometry", etc. instead of mostly NULLs.

## Summary of Changes

### Files Modified:
1. `components/question-viewer.jsx` - Fixed metadata to include domain
2. `lib/local-storage.js` - Already had domain support (no change needed)
3. `lib/supabase-data.js` - Already had domain support (no change needed)
4. `package.json` - Added backfill script

### Files Created:
1. `supabase/migrations/011_backfill_domain_data.sql` - Database functions for bulk updates
2. `scripts/backfill-domains.js` - Node script to backfill data
3. `DOMAIN_FIX_INSTRUCTIONS.md` - This file

## Domain Examples

Expected domain values in the database:
- **Math**: "Algebra", "Advanced Math", "Geometry", "Problem-Solving and Data Analysis"
- **Reading & Writing**: "Information and Ideas", "Craft and Structure", "Expression of Ideas", "Standard English Conventions"

## Next Steps

1. Run the database migration (step 2 above)
2. Run the backfill script: `npm run backfill:domains`
3. Test on a fresh question to verify new answers save correctly
4. Check the stats page to see proper domain grouping
5. Commit and push to staging for testing
