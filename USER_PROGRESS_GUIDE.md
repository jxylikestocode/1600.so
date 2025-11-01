# 📊 How Users Track Progress - Complete Guide

## Overview

Users can now track their complete SAT prep journey with **3 main features**:

1. **My Progress** (`/stats`) - Personal dashboard with detailed statistics
2. **Review** (`/review`) - Browse bookmarked and attempted questions
3. **Live Indicators** - Visual badges showing previous attempts on each question

---

## 1️⃣ My Progress Dashboard (`/stats`)

### How to Access
- Click **"My Progress"** button in the top-right corner of the home page
- Or visit: `http://localhost:3000/stats`

### What Users See

#### **Key Metrics (Top Cards)**
```
┌─────────────────────────────────────────────────────────┐
│  📊 Questions    |  ✅ Accuracy  |  ⏱️ Study Time  |  🔥 Streak  │
│     Answered     |              |                |             │
│       42         |    78.6%     |     45m        |    3 days   │
│   32 correct     |   32 / 42    |    64s avg     |             │
└─────────────────────────────────────────────────────────┘
```

#### **Performance by Subject**
- **Math**: Total answered, correct, accuracy %, time spent, visual progress bar
- **Reading & Writing**: Same metrics

#### **Performance by Skill**
- Lists all practiced skills sorted by activity
- Shows: attempts, correct answers, accuracy %, average time
- Color-coded accuracy bars:
  - 🟢 Green: ≥70% (strong)
  - 🟡 Yellow: 50-69% (needs work)
  - 🔴 Red: <50% (focus here!)

#### **Quick Actions**
- **Review Incorrect Answers** → Go to `/review` filtered for wrong answers
- **Practice Weakest Skill** → Jump to questions for your lowest-accuracy skill
- **Continue Practicing** → Return to home

### Empty State
- Shows when user hasn't answered any questions yet
- "Start Practicing" button to begin

---

## 2️⃣ Review Page (`/review`)

### How to Access
- Click **"Review"** button in the top-right corner of the home page
- Or visit: `http://localhost:3000/review`

### Filter Tabs

Users can filter their review queue by:

1. **All** - All questions you've interacted with (answered or bookmarked)
2. **📚 Bookmarked** - Questions marked for review (yellow bookmark icon)
3. **❌ Incorrect** - Questions answered incorrectly
4. **✅ Correct** - Questions answered correctly

### Question Cards

Each question shows:
- **Question number** in the filtered list
- **Status badges**:
  - 📚 Bookmarked (yellow)
  - ✅ Correct (green)
  - ❌ Incorrect (red)
  - Number of attempts
- **Metadata**: Subject, category, difficulty (Easy/Medium/Hard)
- **Review button** to view the question

### Features

- **Click any question card** to review it
- **Start Review Session** button at the bottom - practices all filtered questions in sequence
- **Empty states** with helpful guidance for each filter

---

## 3️⃣ Live Progress Indicators

### On Question Pages

When viewing a question, users see **badges** showing their history:

#### **✅ Correct Badge** (Green)
- Shows: "✓ Correct"
- Appears when: User previously answered this question correctly
- Question is locked (can't re-answer until navigating away and back)

#### **❌ Attempted Badge** (Red)
- Shows: "✗ Attempted"
- Appears when: User tried this question but got it wrong
- Can retry the question immediately

#### **📚 Bookmark Indicator** (Yellow)
- "Mark for Review" button turns yellow when bookmarked
- Filled bookmark icon
- Persists across sessions

---

## 📈 How Progress is Tracked

### What Gets Saved (LocalStorage)

Every time a user:

1. **Answers a question**:
   - ✅ Answer (correct/incorrect)
   - ⏱️ Time spent
   - 📅 Timestamp
   - 🔄 Attempt number (supports retries)

2. **Bookmarks a question**:
   - 📚 Question ID added to bookmarks list

3. **Eliminates answer choices**:
   - 🚫 Eliminated choice IDs saved per question

### Statistics Calculated

- **Total Questions Answered**: Unique questions attempted
- **Accuracy**: (Correct / Total) × 100%
- **Study Time**: Sum of all time spent
- **Average Time**: Total time / questions
- **Streak**: Consecutive days studied
- **By Subject**: All metrics split Math vs Reading/Writing
- **By Skill**: All metrics per skill (e.g., "Linear equations")

---

## 🎯 User Journey Example

### Day 1: First Session
```
1. User visits homepage → Sees 3,271 questions
2. Clicks "Linear equations in one variable" skill
3. Answers 5 questions:
   - Q1: ✅ Correct (45s)
   - Q2: ❌ Wrong (62s)
   - Q3: ✅ Correct (38s)
   - Q4: ❌ Wrong → Retry → ✅ Correct (95s)
   - Q5: ✅ Correct, bookmarks it (52s)

4. Clicks "My Progress" button
   - Sees: 5 questions answered, 80% accuracy, 5m study time, 1-day streak
   - Math: 100% of progress
   - Linear equations: 5 answered, 4 correct, 80%

5. Clicks "Review" button
   - Filters to "Incorrect" → Sees Q2 and Q4
   - Filters to "Bookmarked" → Sees Q5
```

### Day 2: Return Visit
```
1. User returns to homepage
2. Clicks "My Progress" → Sees updated streak: 2 days! 🔥
3. Clicks "Practice Weakest Skill" button
   - Auto-navigates to questions from their lowest accuracy skill

4. Answers more questions, sees indicators:
   - Q4 from yesterday shows "✓ Correct" badge (already got it right)
   - Q2 from yesterday shows "✗ Attempted" badge (still wrong)

5. Reviews incorrect answers:
   - Goes to /review → Filters "Incorrect"
   - Practices Q2 again → Gets it right!
   - Next time shows "✓ Correct" badge
```

---

## 📱 Visual Guide

### Home Page Navigation
```
┌──────────────────────────────────────────────────────────────┐
│  1600.so - SAT Question Bank     [My Progress]  [Review]     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  [Filters: Difficulty, Active Questions, etc.]                │
│                                                                │
│  ┌─ Reading & Writing ─────┐  ┌─ Math ──────────────┐       │
│  │ Information and Ideas    │  │ Algebra              │       │
│  │ Craft and Structure      │  │ Geometry             │       │
│  └──────────────────────────┘  └──────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### Question Page with Indicators
```
┌──────────────────────────────────────────────────────────────┐
│  [1] [✓ Correct] [📚 Mark for Review]              00:45     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Question content here...                                     │
│                                                                │
│  ○ A) Choice 1                                                │
│  ● B) Choice 2   ← [Check Answer]                            │
│  ○ C) Choice 3                                                │
│  ○ D) Choice 4                                                │
│                                                                │
│              [← Previous]  [Next →]                           │
└──────────────────────────────────────────────────────────────┘
```

### My Progress Page
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]  Your Progress                                      │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  │ 42     │ │ 78.6%  │ │ 45m    │ │ 3 days │                │
│  │Answered│ │Accuracy│ │ Study  │ │ Streak │                │
│  └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                │
│  Performance by Subject                                       │
│  ┌─ Math ─────────────────┐ ┌─ Reading ─────────────┐       │
│  │ 24 answered             │ │ 18 answered            │       │
│  │ 20 correct              │ │ 12 correct             │       │
│  │ 83.3% accuracy          │ │ 66.7% accuracy         │       │
│  │ ████████████░░░░░░      │ │ ████████░░░░░░░░░      │       │
│  └─────────────────────────┘ └────────────────────────┘       │
│                                                                │
│  Performance by Skill                                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Linear equations       12 answered  │ 10 correct │ 83% │ │
│  │ ████████████████░░░░                               │     │ │
│  │                                                     │     │ │
│  │ Quadratic equations     8 answered  │  5 correct │ 63% │ │
│  │ ████████████░░░░░░░░                               │     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Review Incorrect] [Practice Weakest] [Continue Practice]   │
└──────────────────────────────────────────────────────────────┘
```

### Review Page
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]  Review Questions                                   │
├──────────────────────────────────────────────────────────────┤
│  [All (42)] [📚 Bookmarked (5)] [❌ Incorrect (8)] [✅ Correct (34)] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─ Question 1 ────────────────────────────────────────────┐ │
│  │ [Q1] [✅ Correct] [📚 Bookmarked]           [Review →] │ │
│  │ Linear equations in one variable                        │ │
│  │ [Math] [Algebra] [Medium]                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ Question 2 ────────────────────────────────────────────┐ │
│  │ [Q2] [❌ Incorrect]  2 attempts             [Review →] │ │
│  │ Systems of equations                                    │ │
│  │ [Math] [Algebra] [Hard]                                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│                  [Start Review Session]                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Coding

### Status Colors
- **Green** (✅): Correct answers, high accuracy (≥70%)
- **Yellow** (📚): Bookmarks, medium accuracy (50-69%)
- **Red** (❌): Incorrect answers, low accuracy (<50%)
- **Blue**: Difficulty badges for "Easy"
- **Orange**: Study streak indicator

### Difficulty Colors
- **Green**: Easy (E)
- **Yellow**: Medium (M)
- **Red**: Hard (H)

---

## 🔄 Data Persistence

### What Persists Across Sessions
- ✅ All answer attempts and scores
- ✅ Bookmarked questions
- ✅ Eliminated answer choices
- ✅ Study time and streaks
- ✅ All statistics

### How It's Stored
- **Browser LocalStorage** (key: `sat_question_bank_data`)
- Automatic save on every action
- No account needed - works offline
- Persists until user clears browser data

---

## 🚀 Key Benefits for Users

1. **See Improvement Over Time**
   - Track accuracy trends
   - Watch study streak grow
   - Identify mastered skills

2. **Focus on Weak Areas**
   - Red-coded skills show where to practice
   - "Practice Weakest Skill" button
   - Review incorrect answers

3. **Efficient Review**
   - Bookmark difficult questions
   - Filter by status (correct/incorrect)
   - Review sessions for focused practice

4. **Motivation**
   - Study streak counter (Duolingo-style)
   - Visual progress bars
   - Green checkmarks for mastered content

5. **No Friction**
   - Zero setup required
   - Works offline
   - Instant feedback
   - No account needed

---

## 📊 Summary

**Users track progress through:**

1. **Real-time Indicators**: See "✓ Correct" or "✗ Attempted" badges on every question
2. **My Progress Dashboard**: Comprehensive stats, skill breakdown, quick actions
3. **Review Page**: Browse and filter all attempted/bookmarked questions
4. **Automatic Tracking**: Everything saves automatically to LocalStorage

**It's fully functional right now** - users can answer questions and immediately see their progress tracked and visualized!
