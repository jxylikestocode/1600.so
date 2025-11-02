# Implementation Plan: Analytics, Authentication & Database

## Architecture Summary
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Analytics**: Behavioral sequences with event chains and user journeys
- **Anonymous Tracking**: Temporary user accounts created immediately
- **Authentication**: Google OAuth + Reddit OAuth + Magic Link (passwordless email)

---

## Phase 1: Supabase Setup & Database Schema Design

### 1.1 Initialize Supabase Project
- Create Supabase project at https://supabase.com
- Install dependencies: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`
- Configure environment variables (API keys, project URL)
- Set up Supabase client utilities (`/lib/supabase/client.ts`, `/lib/supabase/server.ts`)

### 1.2 Database Schema Implementation
Create tables via Supabase SQL editor:

**users** table:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_temporary BOOLEAN DEFAULT true,
  upgraded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_temporary ON users(is_temporary);
```

**user_answers** table:
```sql
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  question_subject TEXT,
  question_skill TEXT,
  question_difficulty TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_user_answers_created_at ON user_answers(created_at);
CREATE INDEX idx_user_answers_user_question ON user_answers(user_id, question_id);
```

**user_bookmarks** table:
```sql
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
```

**user_eliminated_choices** table:
```sql
CREATE TABLE user_eliminated_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  eliminated_choices JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_user_eliminated_choices_user_id ON user_eliminated_choices(user_id);
```

**user_preferences** table:
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  selected_bands JSONB DEFAULT '[]',
  last_skill TEXT,
  last_subject TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**analytics_events** table:
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  page_path TEXT,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_user_session ON analytics_events(user_id, session_id);
```

**user_sessions** table:
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL UNIQUE,
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
```

### 1.3 Set Up Row Level Security (RLS)
Enable RLS policies for each table:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_eliminated_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read their own answers
CREATE POLICY "Users can read own answers" ON user_answers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own answers
CREATE POLICY "Users can insert own answers" ON user_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own bookmarks
CREATE POLICY "Users can read own bookmarks" ON user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own bookmarks
CREATE POLICY "Users can insert own bookmarks" ON user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (Add policies for user_eliminated_choices, user_preferences, analytics_events, user_sessions)

-- Admin can read everything (using service role key)
```

---

## Phase 2: Authentication System

### 2.1 Configure Supabase Auth Providers
In Supabase Dashboard → Authentication → Providers:

**Google OAuth:**
1. Create OAuth credentials at https://console.cloud.google.com/
2. Add authorized redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret to Supabase
4. Enable Google provider in Supabase

**Reddit OAuth:**
1. Create app at https://www.reddit.com/prefs/apps
2. Set redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret to Supabase
4. Enable Reddit provider in Supabase

**Magic Link (Email):**
1. Enable Email provider in Supabase
2. Disable password authentication (magic link only)
3. Configure email templates (optional customization)

### 2.2 Create Auth Components

**`/components/auth/sign-in-button.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth-modal';

export function SignInButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        Sign In
      </Button>
      <AuthModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
```

**`/components/auth/auth-modal.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const handleRedditSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'reddit',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (!error) {
      alert('Check your email for the magic link!');
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Modal content with three auth options */}
    </Dialog>
  );
}
```

**`/components/auth/user-menu.tsx`**
```typescript
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';

export function UserMenu({ user }: { user: any }) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div>
      <Avatar src={user.avatar_url} />
      {/* Dropdown menu with Profile, Settings, Sign Out */}
    </div>
  );
}
```

### 2.3 Implement Auth Routes

**`/app/auth/callback/route.ts`**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { migrateTemporaryAccount } from '@/lib/migration/localStorage-to-supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);

    // Check if this is an account upgrade (temp account exists)
    const tempUserId = request.cookies.get('temp_user_id')?.value;
    if (tempUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Trigger migration from temp account to permanent account
        await migrateTemporaryAccount(tempUserId, user.id);
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin);
}
```

**`/app/auth/sign-out/route.ts`**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();
  return NextResponse.redirect('/');
}
```

### 2.4 Temporary Account Creation

**`/lib/temp-account.ts`**
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function createTemporaryAccount() {
  // Check if temp account already exists
  const tempUserId = localStorage.getItem('temp_user_id');
  if (tempUserId) return tempUserId;

  // Create new temporary user in database
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('users')
    .insert({
      is_temporary: true,
      email: null
    })
    .select()
    .single();

  if (data) {
    localStorage.setItem('temp_user_id', data.id);
    return data.id;
  }

  return null;
}

export function getTemporaryUserId() {
  return localStorage.getItem('temp_user_id');
}

export function clearTemporaryUserId() {
  localStorage.removeItem('temp_user_id');
}
```

---

## Phase 3: Data Migration System

### 3.1 Create Migration Utilities

**`/lib/migration/localStorage-to-supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import { getUserData } from '@/lib/local-storage';

export async function migrateTemporaryAccount(tempUserId: string, newUserId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for migration
  );

  try {
    // Get localStorage data
    const localData = getUserData();

    // 1. Migrate answers
    await migrateAnswers(supabase, tempUserId, newUserId, localData.answers);

    // 2. Migrate bookmarks
    await migrateBookmarks(supabase, tempUserId, newUserId, localData.bookmarks);

    // 3. Migrate eliminated choices
    await migrateEliminatedChoices(supabase, tempUserId, newUserId, localData.eliminatedChoices);

    // 4. Migrate preferences
    await migratePreferences(supabase, tempUserId, newUserId, localData.preferences);

    // 5. Update temporary user to permanent
    await supabase
      .from('users')
      .update({
        is_temporary: false,
        upgraded_at: new Date().toISOString()
      })
      .eq('id', newUserId);

    // 6. Mark old temp account for deletion (or delete immediately)
    await supabase
      .from('users')
      .delete()
      .eq('id', tempUserId);

    return { success: true };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
}

async function migrateAnswers(supabase: any, tempUserId: string, newUserId: string, answers: any) {
  const answerRecords = Object.entries(answers).flatMap(([questionId, history]: [string, any]) => {
    return history.attempts.map((attempt: any, index: number) => ({
      user_id: newUserId,
      question_id: questionId,
      answer: attempt.answer,
      is_correct: attempt.correct,
      time_spent_seconds: attempt.timeSpent,
      attempt_number: index + 1,
      question_subject: history.subject,
      question_skill: history.skill_desc,
      question_difficulty: history.difficulty,
      created_at: attempt.timestamp
    }));
  });

  if (answerRecords.length > 0) {
    await supabase.from('user_answers').insert(answerRecords);
  }
}

async function migrateBookmarks(supabase: any, tempUserId: string, newUserId: string, bookmarks: string[]) {
  const bookmarkRecords = bookmarks.map(questionId => ({
    user_id: newUserId,
    question_id: questionId
  }));

  if (bookmarkRecords.length > 0) {
    await supabase.from('user_bookmarks').insert(bookmarkRecords);
  }
}

async function migrateEliminatedChoices(supabase: any, tempUserId: string, newUserId: string, eliminatedChoices: any) {
  const choiceRecords = Object.entries(eliminatedChoices).map(([questionId, choices]) => ({
    user_id: newUserId,
    question_id: questionId,
    eliminated_choices: choices
  }));

  if (choiceRecords.length > 0) {
    await supabase.from('user_eliminated_choices').insert(choiceRecords);
  }
}

async function migratePreferences(supabase: any, tempUserId: string, newUserId: string, preferences: any) {
  await supabase.from('user_preferences').insert({
    user_id: newUserId,
    selected_bands: preferences.selectedBands || [],
    last_skill: preferences.lastSkill,
    last_subject: preferences.lastSubject
  });
}
```

### 3.2 Migration Flow Implementation

**Flow Diagram:**
```
1. User visits site (anonymous)
   ↓
2. Create temp account automatically
   ↓
3. User practices (all data saved to temp account)
   ↓
4. User clicks "Sign In"
   ↓
5. Auth modal shows (Google/Reddit/Email)
   ↓
6. User authenticates
   ↓
7. OAuth callback triggered
   ↓
8. Detect temp_user_id cookie exists
   ↓
9. Run migration: temp data → new user account
   ↓
10. Clear temp_user_id cookie
    ↓
11. Show success: "Welcome! Your progress has been saved."
    ↓
12. Continue using app (now authenticated)
```

### 3.3 Sync Layer (Hybrid Approach)

**`/lib/data-sync.ts`**
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { saveAnswer as saveAnswerLocal, toggleBookmark as toggleBookmarkLocal } from './local-storage';

const supabase = createClientComponentClient();

export async function saveAnswer(questionId: string, answer: string, isCorrect: boolean, timeSpent: number, questionMeta: any) {
  // 1. Save to localStorage (for offline support)
  saveAnswerLocal(questionId, answer, isCorrect, timeSpent, questionMeta);

  // 2. Save to Supabase (if online)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || localStorage.getItem('temp_user_id');

    if (userId) {
      // Get attempt number
      const { count } = await supabase
        .from('user_answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('question_id', questionId);

      await supabase.from('user_answers').insert({
        user_id: userId,
        question_id: questionId,
        answer,
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
        attempt_number: (count || 0) + 1,
        question_subject: questionMeta.subject,
        question_skill: questionMeta.skill_desc,
        question_difficulty: questionMeta.difficulty
      });
    }
  } catch (error) {
    console.error('Failed to sync answer to Supabase:', error);
    // Continue anyway - localStorage has the data
  }
}

export async function toggleBookmark(questionId: string) {
  // 1. Toggle in localStorage
  const isBookmarked = toggleBookmarkLocal(questionId);

  // 2. Sync to Supabase
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || localStorage.getItem('temp_user_id');

    if (userId) {
      if (isBookmarked) {
        await supabase.from('user_bookmarks').insert({
          user_id: userId,
          question_id: questionId
        });
      } else {
        await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('question_id', questionId);
      }
    }
  } catch (error) {
    console.error('Failed to sync bookmark to Supabase:', error);
  }

  return isBookmarked;
}

export async function syncFromSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all user data from Supabase
    const [answers, bookmarks, preferences] = await Promise.all([
      supabase.from('user_answers').select('*').eq('user_id', user.id),
      supabase.from('user_bookmarks').select('*').eq('user_id', user.id),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single()
    ]);

    // Update localStorage with server data (server wins)
    // ... implementation details
  } catch (error) {
    console.error('Failed to sync from Supabase:', error);
  }
}
```

---

## Phase 4: Enhanced Analytics Implementation

### 4.1 Update Analytics Library

**`/lib/analytics.ts`** (converted from .js)
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

let sessionId: string | null = null;
let sequenceNumber = 0;
let eventQueue: any[] = [];

function getSessionId() {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
}

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || localStorage.getItem('temp_user_id');
}

async function trackEvent(eventType: string, eventData: any, pagePath?: string) {
  const userId = await getUserId();
  const event = {
    user_id: userId,
    session_id: getSessionId(),
    event_type: eventType,
    event_data: eventData,
    page_path: pagePath || window.location.pathname,
    sequence_number: ++sequenceNumber,
    created_at: new Date().toISOString()
  };

  eventQueue.push(event);

  // Batch send events
  if (eventQueue.length >= 10) {
    await flushEvents();
  }
}

async function flushEvents() {
  if (eventQueue.length === 0) return;

  try {
    const eventsToSend = [...eventQueue];
    eventQueue = [];

    await supabase.from('analytics_events').insert(eventsToSend);
  } catch (error) {
    console.error('Failed to send analytics events:', error);
    // Re-queue failed events
    eventQueue = [...eventQueue, ...eventQueue];
  }
}

// Auto-flush every 30 seconds
setInterval(flushEvents, 30000);

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushEvents);
}

export const analytics = {
  trackAnswer: (questionId: string, skill: string, subject: string, difficulty: string, correct: boolean, timeSpent: number) => {
    trackEvent('answer', {
      question_id: questionId,
      skill,
      subject,
      difficulty,
      correct,
      time_spent: timeSpent
    });
  },

  trackNavigation: (from: string, to: string, method: string) => {
    trackEvent('navigation', { from, to, method });
  },

  trackFeature: (feature: string, action: string, context?: any) => {
    trackEvent('feature', { feature, action, ...context });
  },

  trackFilter: (filterType: string, value: string, previousValue?: string) => {
    trackEvent('filter', { filter_type: filterType, value, previous_value: previousValue });
  },

  trackPageView: (page: string, metadata?: any) => {
    trackEvent('page_view', metadata, page);
  },

  trackEventSequence: (events: any[]) => {
    events.forEach(e => trackEvent(e.type, e.data));
  },

  trackUserJourney: (path: string[]) => {
    trackEvent('user_journey', { path });
  },

  trackTimeOnQuestion: (questionId: string, seconds: number) => {
    trackEvent('time_on_question', { question_id: questionId, seconds });
  },

  flush: flushEvents
};
```

### 4.2 Create Analytics API Routes

**`/app/api/analytics/events/route.ts`**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const events = await request.json();

  const { error } = await supabase
    .from('analytics_events')
    .insert(events);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const sessionId = searchParams.get('session_id');
  const eventType = searchParams.get('event_type');

  let query = supabase.from('analytics_events').select('*');

  if (userId) query = query.eq('user_id', userId);
  if (sessionId) query = query.eq('session_id', sessionId);
  if (eventType) query = query.eq('event_type', eventType);

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

**`/app/api/analytics/user-journey/route.ts`**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  // Get all events for user, ordered by session and sequence
  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', userId)
    .order('session_id')
    .order('sequence_number');

  // Group by session
  const sessions: any = {};
  events?.forEach(event => {
    if (!sessions[event.session_id]) {
      sessions[event.session_id] = [];
    }
    sessions[event.session_id].push(event);
  });

  // Build journey map
  const journeys = Object.entries(sessions).map(([sessionId, sessionEvents]) => ({
    session_id: sessionId,
    events: sessionEvents,
    duration: calculateSessionDuration(sessionEvents as any[]),
    pages_visited: getUniquePages(sessionEvents as any[])
  }));

  return NextResponse.json({ journeys });
}

function calculateSessionDuration(events: any[]) {
  if (events.length === 0) return 0;
  const first = new Date(events[0].created_at).getTime();
  const last = new Date(events[events.length - 1].created_at).getTime();
  return (last - first) / 1000; // seconds
}

function getUniquePages(events: any[]) {
  return [...new Set(events.map(e => e.page_path))];
}
```

**`/app/api/analytics/funnels/route.ts`**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // Define funnel stages
  const stages = [
    { name: 'Visit Home', event_type: 'page_view', page_path: '/' },
    { name: 'Filter Questions', event_type: 'filter' },
    { name: 'View Question', event_type: 'page_view', page_path_pattern: '/question/' },
    { name: 'Answer Question', event_type: 'answer' },
    { name: 'Sign Up', event_type: 'auth', action: 'signup' }
  ];

  // Calculate conversion rates for each stage
  const funnelData = await Promise.all(
    stages.map(async (stage, index) => {
      let query = supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .eq('event_type', stage.event_type);

      if (stage.page_path) {
        query = query.eq('page_path', stage.page_path);
      }

      const { count } = await query;

      return {
        stage: stage.name,
        users: count || 0,
        conversion_rate: index === 0 ? 100 : 0 // Calculate based on previous stage
      };
    })
  );

  // Calculate conversion rates
  for (let i = 1; i < funnelData.length; i++) {
    funnelData[i].conversion_rate =
      (funnelData[i].users / funnelData[i - 1].users) * 100;
  }

  return NextResponse.json({ funnel: funnelData });
}
```

### 4.3 Build Admin Analytics Dashboard

**Enhanced `/app/admin/page.tsx`**
- Add user behavior heatmap (most viewed questions)
- Sequential flow visualization (Sankey diagram using recharts or D3)
- Cohort retention charts
- Answer pattern analysis (learning curves)
- Session replay (event timeline viewer)
- Real-time active users (using Supabase real-time subscriptions)
- Funnel visualization

### 4.4 Client-Side Event Tracking Updates

**Update all pages to track comprehensive events:**

**In `/app/page.js` (home/filter page):**
```typescript
// Track filter changes
analytics.trackFilter('subject', newSubject, previousSubject);
analytics.trackFilter('difficulty', newDifficulty, previousDifficulty);
analytics.trackFilter('skill', newSkill, previousSkill);
```

**In `/app/question/[id]/page.js`:**
```typescript
// Track question view
analytics.trackPageView(`/question/${questionId}`, {
  subject: question.subject,
  skill: question.skill_desc,
  difficulty: question.difficulty
});

// Track time spent (on unmount or answer)
analytics.trackTimeOnQuestion(questionId, timeSpentSeconds);

// Track answer submission
analytics.trackAnswer(questionId, skill, subject, difficulty, isCorrect, timeSpent);
```

**In navigation components:**
```typescript
analytics.trackNavigation(currentQuestionId, nextQuestionId, 'next');
analytics.trackNavigation(currentQuestionId, nextQuestionId, 'prev');
analytics.trackNavigation(null, questionId, 'grid');
```

---

## Phase 5: User Data Context Refactoring

### 5.1 Update UserData Context Provider

**`/contexts/user-data-context.tsx`**
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { syncFromSupabase } from '@/lib/data-sync';
import { createTemporaryAccount } from '@/lib/temp-account';

interface UserDataContextType {
  user: User | null;
  isLoading: boolean;
  saveAnswer: (questionId: string, answer: string, isCorrect: boolean, timeSpent: number, meta: any) => Promise<void>;
  toggleBookmark: (questionId: string) => Promise<boolean>;
  getQuestionHistory: (questionId: string) => any;
  // ... other methods
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Initialize auth state
    async function initAuth() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        // Sync data from Supabase
        await syncFromSupabase();
      } else {
        // Create temporary account
        await createTemporaryAccount();
      }

      setIsLoading(false);
    }

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncFromSupabase();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Implement data methods using sync layer
  const contextValue: UserDataContextType = {
    user,
    isLoading,
    saveAnswer: async (questionId, answer, isCorrect, timeSpent, meta) => {
      // Use sync layer from data-sync.ts
      await saveAnswer(questionId, answer, isCorrect, timeSpent, meta);
    },
    toggleBookmark: async (questionId) => {
      // Use sync layer from data-sync.ts
      return await toggleBookmark(questionId);
    },
    getQuestionHistory: (questionId) => {
      // Read from localStorage (cached)
      return getQuestionHistory(questionId);
    },
    // ... implement other methods
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
}
```

### 5.2 Create Data Hooks

**`/lib/hooks/use-user-answers.ts`**
```typescript
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useUserAnswers(userId?: string) {
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchAnswers() {
      if (!userId) return;

      const { data } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setAnswers(data || []);
      setIsLoading(false);
    }

    fetchAnswers();
  }, [userId, supabase]);

  return { answers, isLoading };
}
```

**Similar hooks:**
- `useUserStats()` - computed statistics from answers
- `useUserBookmarks()` - bookmark management
- `useUserProgress()` - progress tracking
- `useUserSession()` - current session info

### 5.3 API Route Updates

**Update `/app/api/questions/route.js`** to support user-specific filtering:
```typescript
// Add query params for personalized recommendations
// ?exclude_mastered=true (hide questions answered correctly 3+ times)
// ?recommended=true (suggest questions based on weak areas)
```

---

## Phase 6: UI/UX Enhancements

### 6.1 Add Auth UI

**Update `/app/layout.tsx`** to add auth UI in header:
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SignInButton } from '@/components/auth/sign-in-button';
import { UserMenu } from '@/components/auth/user-menu';

export default async function RootLayout({ children }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html>
      <body>
        <header>
          <div className="flex justify-between items-center p-4">
            <h1>1600.so</h1>
            {user ? <UserMenu user={user} /> : <SignInButton />}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
```

**Create `/app/profile/page.tsx`:**
```typescript
'use client';

import { useUserData } from '@/contexts/user-data-context';
import { Card } from '@/components/ui/card';

export default function ProfilePage() {
  const { user } = useUserData();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <img src={user?.avatar_url} alt="" className="w-20 h-20 rounded-full" />
          <div>
            <h2 className="text-xl font-bold">{user?.full_name || user?.email}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        {/* Stats summary */}
        {/* Data export/delete buttons */}
      </Card>
    </div>
  );
}
```

### 6.2 Migration UI

**Create `/components/migration-modal.tsx`:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

export function MigrationModal({ open, onComplete }: { open: boolean; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Migrating your data...');

  useEffect(() => {
    if (!open) return;

    // Simulate migration progress
    const steps = [
      'Migrating answers...',
      'Migrating bookmarks...',
      'Migrating preferences...',
      'Finalizing...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps.length) * 100);
      setStatus(steps[currentStep - 1] || 'Complete!');

      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [open, onComplete]);

  return (
    <Dialog open={open}>
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Setting up your account</h2>
        <p className="text-gray-600 mb-6">{status}</p>
        <Progress value={progress} />
      </div>
    </Dialog>
  );
}
```

### 6.3 Data Privacy Controls

**Add to profile page:**
- Export data button (downloads JSON with all user data)
- Delete account button (with confirmation)
- Analytics opt-out toggle (respects user preferences)

---

## Phase 7: Testing & Deployment

### 7.1 Testing Checklist

**Anonymous User Flow:**
- [ ] Visit site → temp account created automatically
- [ ] Answer questions → data saved to temp account
- [ ] Bookmark questions → bookmarks saved
- [ ] Use features → all actions tracked in analytics
- [ ] Close browser → reopen → data persists in localStorage

**Account Upgrade Flow:**
- [ ] Click "Sign In" with existing temp account data
- [ ] Select Google OAuth → authenticate → callback
- [ ] Migration modal shows → all data migrates successfully
- [ ] Dashboard shows all previous progress
- [ ] localStorage still works as cache
- [ ] Repeat with Reddit OAuth
- [ ] Repeat with Magic Link

**Data Sync:**
- [ ] Make changes on device 1
- [ ] Sign in on device 2 → see same data
- [ ] Make changes on device 2
- [ ] Return to device 1 → data syncs automatically
- [ ] Go offline → make changes → come online → data syncs

**Analytics:**
- [ ] Verify events are tracked correctly
- [ ] Check sequence numbers are incremental
- [ ] Verify session boundaries
- [ ] Check admin dashboard shows accurate data
- [ ] Test funnel visualization

**Edge Cases:**
- [ ] Multiple temp accounts (different browsers/devices)
- [ ] Network failures during migration
- [ ] Duplicate bookmarks/answers handling
- [ ] Concurrent updates from multiple devices
- [ ] localStorage quota exceeded scenarios

### 7.2 Environment Setup

**Vercel Environment Variables:**
```bash
# Add to Vercel project settings
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (keep secret!)
```

**OAuth Redirect URLs:**
- Google Console: Add `https://your-project.vercel.app/auth/callback`
- Reddit App Settings: Add `https://your-project.vercel.app/auth/callback`
- Supabase Auth Settings: Configure site URL

**CORS Configuration:**
- Supabase → Settings → API → Add your domain to allowed origins

### 7.3 Migration Strategy for Existing Users

**Gradual Rollout Plan:**

1. **Week 1: Soft Launch (10% of users)**
   - Enable new auth system for 10% of traffic
   - Show banner: "New: Save your progress across devices! Sign in now."
   - Monitor error rates and user feedback

2. **Week 2: Expand (50% of users)**
   - Increase to 50% if no major issues
   - Add migration success metrics to admin dashboard
   - Collect user feedback

3. **Week 3: Full Rollout (100% of users)**
   - Enable for all users
   - Keep localStorage fallback for 1 month
   - Monitor migration completion rates

**Banner Implementation:**
```typescript
// Show in header for anonymous users
{!user && (
  <div className="bg-blue-600 text-white p-3 text-center">
    <strong>Save your progress!</strong> Sign in to sync your answers and bookmarks across all devices.
    <button onClick={() => setShowAuthModal(true)} className="ml-4 underline">
      Sign In
    </button>
  </div>
)}
```

---

## Implementation Order (Week-by-Week)

### Week 1: Foundation
**Days 1-2: Supabase Setup**
- [ ] Create Supabase project
- [ ] Run database schema SQL scripts
- [ ] Set up RLS policies
- [ ] Configure environment variables
- [ ] Install npm dependencies

**Days 3-4: Temp Account System**
- [ ] Create `temp-account.ts` utility
- [ ] Auto-create temp account on first visit
- [ ] Update UserDataContext to support temp accounts
- [ ] Test temp account creation and data storage

**Day 5: Auth Components (UI only)**
- [ ] Create SignInButton component
- [ ] Create AuthModal component (UI shell)
- [ ] Create UserMenu component
- [ ] Add to layout/header

### Week 2: Authentication
**Days 1-2: OAuth Setup**
- [ ] Configure Google OAuth in Supabase
- [ ] Configure Reddit OAuth in Supabase
- [ ] Create OAuth apps in Google/Reddit consoles
- [ ] Test OAuth flows

**Days 3-4: Magic Link**
- [ ] Configure email provider in Supabase
- [ ] Implement magic link flow
- [ ] Customize email templates
- [ ] Test email delivery

**Day 5: Auth Routes & Callbacks**
- [ ] Create `/app/auth/callback/route.ts`
- [ ] Create `/app/auth/sign-out/route.ts`
- [ ] Test full auth flows

### Week 3: Data Migration
**Days 1-2: Migration Utilities**
- [ ] Create `localStorage-to-supabase.ts`
- [ ] Implement `migrateAnswers()`
- [ ] Implement `migrateBookmarks()`
- [ ] Implement `migratePreferences()`
- [ ] Unit test each migration function

**Days 3-4: Account Upgrade Flow**
- [ ] Detect temp account in auth callback
- [ ] Trigger migration on successful auth
- [ ] Create MigrationModal component
- [ ] Handle migration errors gracefully

**Day 5: Sync Layer**
- [ ] Create `data-sync.ts`
- [ ] Implement dual-write (localStorage + Supabase)
- [ ] Implement sync-on-load
- [ ] Test offline/online scenarios

### Week 4: Analytics Enhancement
**Days 1-2: Analytics Library Update**
- [ ] Convert `/lib/analytics.js` to TypeScript
- [ ] Add user_id to all events
- [ ] Add sequence tracking
- [ ] Implement event queue with retry logic

**Days 3-4: Analytics API Routes**
- [ ] Create `/app/api/analytics/events/route.ts`
- [ ] Create `/app/api/analytics/user-journey/route.ts`
- [ ] Create `/app/api/analytics/funnels/route.ts`
- [ ] Create `/app/api/analytics/sessions/route.ts`

**Day 5: Client-Side Tracking**
- [ ] Add tracking to all pages
- [ ] Track filter changes
- [ ] Track navigation patterns
- [ ] Track feature usage

### Week 5: Testing & Polish
**Days 1-2: Admin Dashboard**
- [ ] Update `/app/admin/page.tsx`
- [ ] Add user journey visualization
- [ ] Add funnel charts
- [ ] Add cohort analysis

**Days 3-4: Comprehensive Testing**
- [ ] Test all auth flows
- [ ] Test data migration
- [ ] Test cross-device sync
- [ ] Test analytics accuracy
- [ ] Test offline/online transitions

**Day 5: Deployment**
- [ ] Deploy to Vercel staging
- [ ] Configure production environment variables
- [ ] Test in staging
- [ ] Deploy to production (10% rollout)
- [ ] Monitor metrics

---

## Key Files Summary

### New Files to Create (Priority Order)

1. **Database & Backend:**
   - `supabase-schema.sql` - Database schema
   - `/lib/supabase/client.ts` - Client-side Supabase client
   - `/lib/supabase/server.ts` - Server-side Supabase client

2. **Authentication:**
   - `/lib/temp-account.ts` - Temporary account management
   - `/components/auth/sign-in-button.tsx` - Sign in button
   - `/components/auth/auth-modal.tsx` - Auth modal with providers
   - `/components/auth/user-menu.tsx` - User avatar/menu
   - `/app/auth/callback/route.ts` - OAuth callback
   - `/app/auth/sign-out/route.ts` - Sign out handler

3. **Migration:**
   - `/lib/migration/localStorage-to-supabase.ts` - Migration utilities
   - `/lib/data-sync.ts` - Dual-write sync layer
   - `/components/migration-modal.tsx` - Migration progress UI

4. **Analytics:**
   - `/lib/analytics.ts` - Enhanced analytics (converted from .js)
   - `/app/api/analytics/events/route.ts` - Events API
   - `/app/api/analytics/user-journey/route.ts` - User journey API
   - `/app/api/analytics/funnels/route.ts` - Funnel analysis API
   - `/app/api/analytics/sessions/route.ts` - Session management API

5. **User Interface:**
   - `/app/profile/page.tsx` - User profile page
   - `/components/data-export-button.tsx` - Export data
   - `/components/delete-account-button.tsx` - Delete account

6. **Hooks:**
   - `/lib/hooks/use-user-answers.ts`
   - `/lib/hooks/use-user-stats.ts`
   - `/lib/hooks/use-user-bookmarks.ts`
   - `/lib/hooks/use-user-session.ts`

### Files to Modify

1. **Context & Data:**
   - `/contexts/user-data-context.tsx` - Add Supabase integration
   - `/lib/local-storage.js` - Add sync hooks

2. **Layout & Navigation:**
   - `/app/layout.tsx` - Add auth UI in header

3. **Pages:**
   - `/app/page.js` - Add analytics tracking for filters
   - `/app/question/[id]/page.js` - Add comprehensive event tracking
   - `/app/stats/page.js` - Add analytics tracking
   - `/app/review/page.js` - Add analytics tracking
   - `/app/admin/page.js` - Enhanced analytics dashboard

4. **Components:**
   - `/components/question-viewer.jsx` - Add event tracking
   - Any navigation components - Add navigation tracking

### Configuration Files

1. **Environment:**
   - `.env.local` - Add Supabase keys
   - `.env.example` - Document required env vars

2. **Package:**
   - `package.json` - Add Supabase dependencies

3. **TypeScript:**
   - `tsconfig.json` - Ensure proper TS config (if converting to TS)

---

## Environment Variables

```bash
# .env.local
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Keep secret!

# Existing
ADMIN_PASSWORD=your-secure-admin-password
```

---

## Dependencies to Install

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## Estimated Timeline & Effort

**Total Duration:** 5 weeks (1 developer, part-time ~20 hours/week)

**Breakdown:**
- Week 1: Foundation (Supabase setup, temp accounts) - 20 hours
- Week 2: Authentication (OAuth, magic link) - 20 hours
- Week 3: Data Migration (migration utilities, sync layer) - 20 hours
- Week 4: Analytics (event tracking, API routes, admin dashboard) - 20 hours
- Week 5: Testing & Deployment (testing, polish, gradual rollout) - 20 hours

**MVP Timeline:** 2-3 weeks (basic auth + data migration only)

**Milestones:**
- ✅ Week 1: Temp accounts working, Supabase configured
- ✅ Week 2: Users can sign in with Google/Reddit/Email
- ✅ Week 3: Data migrates from localStorage to Supabase on signup
- ✅ Week 4: Behavioral analytics tracking full user journeys
- ✅ Week 5: Production-ready with monitoring

---

## Success Metrics

**User Adoption:**
- % of anonymous users who sign up
- Time to first signup (from first visit)
- % of users who complete migration successfully

**Data Quality:**
- % of localStorage data successfully migrated
- Sync failures / total syncs
- Analytics events captured / expected events

**Performance:**
- Migration completion time (target: < 5 seconds)
- API response times (target: < 200ms p95)
- Real-time sync latency (target: < 1 second)

**User Engagement:**
- Cross-device usage rates
- Returning user rate (vs. anonymous single-visit)
- Feature adoption after authentication

---

## Risk Mitigation

**Risk 1: Migration Data Loss**
- Mitigation: Keep localStorage as backup for 1 month
- Fallback: Allow users to manually export/import data

**Risk 2: OAuth Provider Issues**
- Mitigation: Support multiple providers + magic link
- Fallback: Email-based magic link always available

**Risk 3: Poor Performance at Scale**
- Mitigation: Database indexes on all query patterns
- Fallback: Caching layer (Redis) if needed

**Risk 4: User Privacy Concerns**
- Mitigation: Clear privacy policy, opt-out options
- Compliance: GDPR-compliant data export/delete

---

## Next Steps

1. **Review this plan** - Confirm architecture decisions
2. **Set up Supabase project** - Create project, configure settings
3. **Install dependencies** - Add Supabase packages
4. **Start with Week 1** - Foundation (temp accounts + DB schema)
5. **Iterate weekly** - Review progress, adjust timeline

Ready to begin implementation? 🚀
