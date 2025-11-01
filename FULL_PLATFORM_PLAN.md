# SAT Question Bank - Full Platform Development Plan

## Vision
Transform the current MVP into a **comprehensive SAT prep platform** with user accounts, progress tracking, practice tests, study plans, and freemium monetization.

## Architecture Strategy

### Hybrid Storage Approach
- **Anonymous Users**: localStorage → Supabase (background sync)
- **Signed-Up Users**: Supabase primary storage
- **Migration Path**: Seamless upgrade from anonymous → authenticated

### Technology Additions
- **Supabase**: Auth, PostgreSQL database, real-time subscriptions
- **Stripe**: Payment processing for premium features
- **Server Actions**: Next.js server-side mutations for database operations

---

## Phase 1: Foundation & Data Persistence (Week 1-2)

### 1.1 Supabase Setup & Schema Design
- Install Supabase client libraries
- Create database schema:
  - `users` (profiles, subscription status)
  - `user_answers` (question attempts, correctness, time spent)
  - `user_progress` (skill mastery, study streaks)
  - `bookmarks` (marked for review)
  - `practice_sessions` (test sessions, scores)
  - `custom_sets` (user-created question collections)
- Set up Row Level Security (RLS) policies
- Create database functions for analytics

### 1.2 LocalStorage → Supabase Sync System
- Create localStorage schema (mirrors Supabase)
- Build background sync service:
  - Periodic sync for anonymous users
  - Real-time sync for authenticated users
- Implement conflict resolution (last-write-wins)
- Migration utility: localStorage → Supabase on signup

### 1.3 State Management Refactor
- Expand FilterContext to include user state
- Create new contexts:
  - `AuthContext` (user session, profile)
  - `ProgressContext` (answers, stats, bookmarks)
  - `SyncContext` (localStorage/Supabase sync manager)
- Server Actions for CRUD operations

---

## Phase 2: Authentication & User Management (Week 2-3)

### 2.1 Auth UI Components
- Sign up / Sign in modal (email/password + OAuth)
  - Google OAuth
  - GitHub OAuth
- Profile page (`/profile`)
- Account settings
- Password reset flow

### 2.2 User Profile & Dashboard
- Create `/dashboard` route
- User stats overview:
  - Questions answered (correct/incorrect)
  - Study time tracked
  - Current streak
  - Skill mastery breakdown
- Recent activity feed

### 2.3 Anonymous → Authenticated Migration
- Prompt anonymous users to sign up (after X questions)
- One-click data migration on signup
- Preserve all localStorage data in Supabase

---

## Phase 3: Progress Tracking & Analytics (Week 3-4)

### 3.1 Answer Tracking System
- Persist answer attempts (correct/incorrect/eliminated choices)
- Track time per question
- Store retry history
- Update `question-viewer.jsx` to save to storage

### 3.2 Performance Analytics
- Calculate metrics:
  - Accuracy by skill/domain/difficulty
  - Average time per question type
  - Improvement trends over time
  - Skill mastery scores (weighted by difficulty)
- Create `/analytics` page with charts:
  - Accuracy line chart (over time)
  - Skill mastery heat map
  - Time distribution histogram
  - Difficulty progression

### 3.3 Bookmark & Review System
- Persist "Mark for Review" functionality
- Create `/review` page:
  - Incorrect answers review mode
  - Bookmarked questions
  - Filter by skill/difficulty
- Show stats (e.g., "73% correct on retry")

---

## Phase 4: Practice Test Mode (Week 4-5)

### 4.1 Test Session Management
- Create `/test/new` route (test configuration)
- Test types:
  - Full-length SAT (4 modules, ~2 hours)
  - Math-only or Reading-only sections
  - Custom question sets
- Test session state management:
  - Track current module/question
  - Section timer (countdown)
  - Break timers between modules
  - Pause/resume functionality

### 4.2 Test Experience UI
- Create `/test/[sessionId]` route
- Module navigation (can't go back after submit)
- Break screens between modules
- Submit confirmation modal
- No calculator/reference on certain modules (SAT rules)

### 4.3 Test Results & Review
- Create `/test/[sessionId]/results` route
- Score report:
  - Section scores (200-800)
  - Total score projection
  - Percentile estimates
  - Breakdown by skill
- Question-by-question review
- Compare to previous tests (trend)

---

## Phase 5: Study Plans & Recommendations (Week 5-6)

### 5.1 Adaptive Question Selection
- Algorithm to recommend next questions:
  - Focus on weak skills
  - Gradually increase difficulty
  - Spaced repetition for mastery
  - Avoid recently seen questions
- Create `/practice` route (guided practice mode)

### 5.2 Study Plan Generator
- Input: target score, test date, study hours/week
- Output: personalized weekly plan
  - Daily question targets
  - Skill focus areas
  - Practice test schedule
- Create `/study-plan` route

### 5.3 Insights & Recommendations
- Smart notifications:
  - "You've mastered Linear Equations! Try Quadratics next."
  - "Your Reading accuracy drops after 20 mins. Take breaks!"
  - "Practice test recommended - you've improved 10% this week"
- Daily study reminders (email/in-app)

---

## Phase 6: Premium Features & Monetization (Week 6-7)

### 6.1 Stripe Integration
- Install Stripe libraries
- Create subscription products:
  - **Free Tier**: 10 questions/day, basic analytics
  - **Premium**: Unlimited questions, full analytics, practice tests, custom sets
- Implement checkout flow
- Create `/pricing` page
- Webhook handlers for subscription events

### 6.2 Feature Gating
- Middleware to check subscription status
- Paywall UI components
- Upgrade prompts at limits
- Free trial (7-14 days)

### 6.3 Subscription Management
- Add to `/profile`:
  - Current plan & billing
  - Usage stats (questions this month)
  - Upgrade/downgrade/cancel options
- Invoice history

---

## Phase 7: Community Features (Week 7-8)

### 7.1 Discussion System
- Create `discussions` table (comments, replies, votes)
- Add discussion panel to `question-viewer.jsx`
- Create `/discussion/[questionId]` page
- Moderation tools (report, flag)
- User reputation system (upvotes)

### 7.2 Custom Question Sets
- Create `/sets` route (browse public sets)
- Create `/sets/new` route (create set)
- Create `/sets/[setId]` route (practice set)
- Share functionality (public/private)
- Upvote popular sets
- Tag system (e.g., "Algebra Review", "Hard Math")

---

## Phase 8: Polish & Optimization (Week 8-9)

### 8.1 Performance Optimization
- Implement React Server Components properly
- Add loading skeletons
- Optimize question data loading (pagination)
- Image optimization (if adding user uploads)
- Code splitting for heavy components (calculator, charts)

### 8.2 Mobile Optimization
- Improve mobile question viewer layout
- Touch-friendly calculator/reference sheet
- Mobile navigation drawer
- Test responsive breakpoints

### 8.3 Accessibility
- Keyboard shortcuts (arrow keys for navigation, space for answer)
- Screen reader support (ARIA labels)
- High contrast mode
- Keyboard-only test taking

### 8.4 SEO & Marketing
- Add metadata for all pages
- Create sitemap
- Add og:image for social sharing
- Create landing page (`/` becomes marketing, questions at `/practice`)
- Add testimonials, pricing comparison

---

## Implementation Order

### Sprint 1-2: Core Infrastructure
- Supabase setup, schema, and sync system
- Authentication (sign up, login, OAuth)
- localStorage → Supabase migration

### Sprint 3-4: Progress & Analytics
- Answer tracking and persistence
- Dashboard with stats
- Analytics page with charts
- Bookmark/review functionality

### Sprint 5-6: Practice Tests
- Test session management
- Full test-taking experience
- Score reports and review

### Sprint 7-8: Intelligence Layer
- Adaptive question recommendations
- Study plan generator
- Insights and notifications

### Sprint 9-10: Monetization
- Stripe integration
- Freemium tier implementation
- Subscription management

### Sprint 11-12: Community & Polish
- Discussion system
- Custom question sets
- Mobile optimization
- Accessibility improvements

---

## Key Technical Decisions

### Database Schema (Supabase)
```sql
-- Core tables
users (id, email, subscription_tier, created_at)
user_answers (user_id, question_id, is_correct, time_spent, attempt_number, created_at)
bookmarks (user_id, question_id, created_at)
practice_sessions (id, user_id, type, start_time, end_time, score)
session_answers (session_id, question_id, user_answer, is_correct)
custom_sets (id, user_id, title, description, question_ids[], is_public)
discussions (id, question_id, user_id, content, parent_id, upvotes)
```

### Free vs Premium Features
**Free**:
- 10 questions/day
- Basic accuracy stats
- Single practice test/month
- Public question sets

**Premium ($19/month)**:
- Unlimited questions
- Full analytics & trends
- Unlimited practice tests
- Custom question sets
- Priority support
- Discussion participation

---

## Files to Create/Modify

### New Files (~40 files)
- `lib/supabase.js` - Supabase client
- `lib/stripe.js` - Stripe client
- `lib/sync.js` - localStorage/Supabase sync
- `contexts/auth-context.jsx`
- `contexts/progress-context.jsx`
- `contexts/sync-context.jsx`
- `app/auth/` - Auth pages
- `app/dashboard/` - Dashboard
- `app/analytics/` - Analytics
- `app/test/` - Practice test routes
- `app/study-plan/` - Study planner
- `app/pricing/` - Pricing page
- `app/profile/` - User profile
- `app/sets/` - Custom sets
- `components/charts/` - Chart components
- `components/test/` - Test-specific UI
- `app/api/webhooks/stripe/` - Stripe webhooks
- Migration scripts

### Modified Files (~10 files)
- `app/page.js` - Add landing/marketing
- `app/question/[id]/page.js` - Add persistence
- `components/question-viewer.jsx` - Track answers
- `components/filter-panel.jsx` - Add saved filters
- `app/layout.js` - Add auth provider
- `lib/data.js` - Add user-specific queries

---

## Estimated Timeline
**Total: 8-10 weeks** (full-time) or **16-20 weeks** (part-time)

This plan transforms your MVP into a comprehensive SAT prep platform with all modern features users expect!
