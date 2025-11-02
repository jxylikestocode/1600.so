# Supabase SQL Scripts

This directory contains SQL scripts for setting up your Supabase database.

## Files

### `schema.sql`
Creates all database tables and indexes.

**Tables created:**
1. `users` - User accounts (both temporary and authenticated)
2. `user_answers` - Answer attempts and history
3. `user_bookmarks` - Bookmarked questions
4. `user_eliminated_choices` - Answer elimination tracking
5. `user_preferences` - User settings and preferences
6. `analytics_events` - Behavioral analytics events
7. `user_sessions` - Session tracking

**Run this FIRST** in Supabase Dashboard → SQL Editor

### `rls-policies.sql`
Enables Row Level Security and creates security policies.

**Security features:**
- Users can only access their own data
- Temporary users can insert data before authentication
- Service role bypasses all policies (for migrations)

**Run this AFTER `schema.sql`**

## How to Execute

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the sidebar
3. Click "New query"
4. Copy and paste the contents of `schema.sql`
5. Click "Run" (or Cmd/Ctrl + Enter)
6. Verify tables were created in **Table Editor**
7. Repeat steps 3-5 for `rls-policies.sql`
8. Verify policies in **Authentication** → **Policies**

## Verification

After running both scripts, you should have:
- ✅ 7 tables in Table Editor
- ✅ RLS enabled on all tables
- ✅ Multiple policies per table in Authentication → Policies

## Need Help?

See `SUPABASE_SETUP_GUIDE.md` in the project root for detailed step-by-step instructions.
