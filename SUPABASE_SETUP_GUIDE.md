# Supabase Setup Guide

## ✅ Completed (by Claude)

- [x] Installed Supabase packages (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Created `.env.local` template with placeholders
- [x] Created database schema SQL (`supabase/schema.sql`)
- [x] Created RLS policies SQL (`supabase/rls-policies.sql`)
- [x] Created Supabase client utilities (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [x] Created TypeScript types (`lib/supabase/types.ts`)

---

## 🔄 Next Steps (You need to do these manually)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project" or "New Project"
3. Sign in with GitHub (recommended) or email
4. Click "New Project"
5. Fill in the form:
   - **Name**: `sat-question-bank` (or your preferred name)
   - **Database Password**: Generate a strong password and **SAVE IT SECURELY**
   - **Region**: Choose the closest to your users (e.g., `US West` or `US East`)
   - **Pricing Plan**: Select "Free" tier (sufficient for MVP)
6. Click "Create new project"
7. ⏳ Wait 2-3 minutes for the project to provision

---

### Step 2: Get API Keys

Once your project is created:

1. In the Supabase Dashboard, go to **Settings** (gear icon in sidebar) → **API**
2. You'll see three important values - copy them all:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon / public key** (starts with `eyJhbGci...` - this is safe to expose to clients)
   - **service_role key** (starts with `eyJhbGci...` - **KEEP THIS SECRET!**)

---

### Step 3: Update Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholders with your actual keys:

```bash
# Replace these with your actual values from Step 2
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep your existing admin password
ADMIN_PASSWORD=admin123
```

3. Save the file

---

### Step 4: Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor** (in the left sidebar)
2. Click "New query" button
3. Open `supabase/schema.sql` in your code editor
4. Copy **ALL** the contents of the file
5. Paste into the SQL Editor in Supabase
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. ✅ You should see a success message: "Database schema created successfully!"

**Verify tables were created:**
- Go to **Table Editor** in the sidebar
- You should see 7 tables:
  - `users`
  - `user_answers`
  - `user_bookmarks`
  - `user_eliminated_choices`
  - `user_preferences`
  - `analytics_events`
  - `user_sessions`

---

### Step 5: Enable Row Level Security

1. Still in **SQL Editor**, click "New query"
2. Open `supabase/rls-policies.sql` in your code editor
3. Copy **ALL** the contents
4. Paste into the SQL Editor
5. Click "Run"
6. ✅ You should see: "Row Level Security policies created successfully!"

**Verify RLS is enabled:**
- Go to **Authentication** → **Policies**
- You should see multiple policies for each table
- All tables should show as "RLS enabled"

---

### Step 6: Restart Dev Server

1. Stop your current dev server (Ctrl+C in terminal)
2. Restart it:
```bash
npm run dev
```

---

### Step 7: Verify Setup

Open your browser dev console and run this test:

```javascript
// Test Supabase connection
import { getSupabaseClient } from '@/lib/supabase/client';
const supabase = getSupabaseClient();

// Try to create a temporary user
const { data, error } = await supabase
  .from('users')
  .insert({ is_temporary: true })
  .select()
  .single();

console.log('Test result:', { data, error });
// Should see: { data: { id: '...', is_temporary: true, ... }, error: null }
```

If you see a user object with no error, **congratulations! Your Supabase is set up correctly! 🎉**

---

## 📁 Files Created

```
project-root/
├── .env.local                    # Environment variables (UPDATE THIS!)
├── supabase/
│   ├── schema.sql               # Database schema (run in Supabase)
│   └── rls-policies.sql         # Security policies (run in Supabase)
├── lib/
│   └── supabase/
│       ├── client.ts            # Client-side Supabase client
│       ├── server.ts            # Server-side Supabase client
│       └── types.ts             # TypeScript types
└── SUPABASE_SETUP_GUIDE.md      # This file
```

---

## 🔍 Troubleshooting

### Error: "relation 'users' does not exist"
- **Solution**: You forgot to run `schema.sql` in Step 4. Go back and run it.

### Error: "row-level security policy violation"
- **Solution**: You forgot to run `rls-policies.sql` in Step 5. Go back and run it.

### Error: "Invalid API key"
- **Solution**: Double-check your `.env.local` file. Make sure you copied the keys correctly from Supabase dashboard.

### Error: "supabase is not defined"
- **Solution**: Restart your dev server after updating `.env.local`

---

## 🎯 What's Next?

After completing this setup, you're ready to move to **Phase 2: Authentication System**

This will include:
- Configuring OAuth providers (Google, Reddit)
- Setting up Magic Link email auth
- Creating sign-in/sign-up UI components
- Implementing temporary account creation

See `IMPLEMENTATION_PLAN.md` for the full roadmap.

---

## 📚 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**Ready?** Follow the steps above, and let me know once you've completed them! 🚀
