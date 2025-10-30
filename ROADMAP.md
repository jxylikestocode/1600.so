# SAT Question Bank - Development Roadmap

## Suggested Next Steps

Based on analyzing the codebase, here are high-impact features to work on next:

---

### **Option 1: Persist Answer State (Track Progress)**

**Problem:** When users navigate between questions, their answers and review marks are lost

**Solution:** Implement localStorage persistence for:
- Correct/incorrect answers per question
- Questions marked for review
- Wrong attempts history
- Time spent per question
- Overall session progress

**Benefits:**
- Users can see which questions they've completed
- Question grid shows visual status (correct/incorrect/review)
- Enable "Review Incorrect" or "Continue Session" features
- Track performance metrics

---

### **Option 2: Implement "Shuffle Question Order" Button**

**Problem:** Button exists (line 821 in question-viewer.jsx) but doesn't do anything

**Solution:** Make it functional to:
- Randomize question order within current filter
- Maintain URL consistency
- Preserve filter context
- Add visual indication when shuffled

**Benefits:**
- Better practice experience
- Prevents memorization of answer positions
- Quick win - smaller scope

---

### **Option 3: Performance Dashboard/Stats**

**Problem:** No way to see overall performance

**Solution:** Add a stats page/component showing:
- Questions attempted/correct/incorrect by skill
- Average time per question
- Score band performance
- Skill mastery indicators
- Session history

**Benefits:**
- Motivational for students
- Identify weak areas
- Track improvement over time

---

### **Option 4: Timer Enhancements**

**Problem:** Timer resets on every question change

**Solution:** Add timer modes:
- Per-question timer (current)
- Session timer (cumulative)
- Countdown timer (practice under pressure)
- Timer reset button
- Time statistics

**Benefits:**
- Realistic test simulation
- Better time management practice

---

### **Option 5: Keyboard Navigation**

**Problem:** Requires mouse clicks for everything

**Solution:** Add keyboard shortcuts:
- Arrow keys for prev/next
- A/B/C/D for answer selection
- Enter to check answer
- Space to mark for review
- Numbers for question grid navigation

**Benefits:**
- Faster workflow
- Better accessibility
- Professional UX

---

## Recommendation

Start with **Option 1 (Persist Answer State)** because it:
1. Unlocks the most value for users
2. Enables future features (stats dashboard, review mode)
3. Makes the question grid functional with visual status
4. Relatively straightforward with localStorage
5. Dramatically improves the user experience

---

## Completed Features

- ✅ Question viewer with SAT Bluebook-style interface
- ✅ Filter panel with multiple filter options
- ✅ Question count summary by subject and skill
- ✅ Navigation between questions
- ✅ Timer functionality (per-question)
- ✅ Mark for review button
- ✅ Answer checking for MCQ questions
- ✅ Answer checking for SPR (Student Produced Response) questions
- ✅ Visual feedback for correct/incorrect answers
- ✅ Explanation popover
- ✅ Question grid navigation
