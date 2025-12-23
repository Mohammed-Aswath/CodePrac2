# Student Login Flow - Root Cause Analysis & Fix Plan

## ⚠️ CRITICAL BUG IDENTIFIED

### Error Details
```
GET http://localhost:5000/api/student/submissions 404 (NOT FOUND)
Location: js/dashboard.js line 56
```

### Root Cause
**The endpoint `/api/student/submissions` does NOT exist in the backend.**

Backend Student Routes (routes/student.py):
- ✅ `/topics` - Get topics for student's department
- ✅ `/questions` - Get questions for student's batch
- ✅ `/questions/<id>` - Get question details
- ✅ `/submit` - Submit code for evaluation
- ✅ `/notes` - Get notes for student's department
- ✅ `/performance` - Get submission history (THIS IS WHAT WE NEED)
- ❌ `/submissions` - DOES NOT EXIST

### Frontend Bug Location
**File**: `js/dashboard.js` line 56
```javascript
const response = await Utils.apiRequest('/student/submissions');  // ← BUG: Endpoint doesn't exist
```

---

## 📋 CodePrac.MD Requirements vs Reality

### What Students SHOULD See (From CodePrac.MD)

#### Tier 3 - Student Flow:
1. **Login** with username/password (provided by department)
2. **Dashboard/Home Page** showing:
   - Topics (grouped by department)
   - Quick stats (questions solved, progress)
3. **Topic List View**
   - Click topic → See all questions in that topic
4. **Problem Solving Interface (LeetCode-Style)**
   - Left: Problem statement, constraints, examples
   - Top Right: Monaco code editor with language selection
   - Bottom Right: Test cases section
   - Buttons: Run Code, Submit, Check Efficiency

### What Currently Works
- ✅ Login (via Firebase)
- ✅ Topic loading endpoint exists
- ✅ Question loading endpoint exists
- ✅ AI agent integration (compiler, evaluator, efficiency)
- ✅ Code submission endpoint exists

### What's Broken
- ❌ Dashboard calls non-existent `/submissions` endpoint
- ❌ Dashboard logic doesn't match requirements
- ❌ No proper topic → questions → problem page navigation
- ❌ LeetCode-style UI not fully implemented

---

## 🔧 Fix Strategy

### Phase 1: Fix Dashboard Error (IMMEDIATE)
**File**: `js/dashboard.js`
**Issue**: Line 56 calls non-existent endpoint
**Solution**: Replace with `/student/performance` which exists and returns submission history

**Change**:
```javascript
// OLD (Line 56):
const response = await Utils.apiRequest('/student/submissions');

// NEW:
const response = await Utils.apiRequest('/student/performance');
```

### Phase 2: Implement Proper Student Flow
1. **Dashboard** shows stats from `/student/performance`
2. **Load Topics** using `/student/topics` endpoint
3. **Topic Click** → Load questions for that topic
4. **Question Click** → Open LeetCode-style problem page
5. **Problem Page** integrates Monaco Editor + AI agents

### Phase 3: Ensure API Alignment
- `/student/topics` - Returns topics for student's department
- `/student/questions` - Returns questions (need to verify filtering)
- `/student/submit` - Evaluates code via agents
- `/student/notes` - Returns batch notes
- `/student/performance` - Returns submission history

---

## 📊 Current Backend Endpoints (Verified)

### Student Endpoints Available
```python
GET  /api/student/topics              # Get topics for student's dept
GET  /api/student/questions           # Get questions
GET  /api/student/questions/<id>      # Get question details
POST /api/student/submit              # Submit code for evaluation
GET  /api/student/notes               # Get notes for student's dept
GET  /api/student/performance         # Get submission history ← USE THIS
GET  /api/student/test                # Test endpoint
```

**NOT AVAILABLE**:
```python
GET  /api/student/submissions         # ❌ DOES NOT EXIST
```

---

## 🎯 Implementation Checklist

### Dashboard Fix
- [ ] Update `loadRecentActivity()` to call `/student/performance` instead of `/student/submissions`
- [ ] Parse response correctly (field names from backend)
- [ ] Display recent submissions in activity table
- [ ] Ensure no errors in browser console

### Student Practice Interface
- [ ] Implement topic → questions grouping
- [ ] Create LeetCode-style problem page UI
- [ ] Integrate Monaco Editor for code input
- [ ] Add language selection dropdown
- [ ] Implement "Run Code" button (calls `/student/submit`)
- [ ] Implement "Submit" button (calls `/student/submit`)
- [ ] Add custom test input textarea
- [ ] Display test results (passed/failed)
- [ ] Show efficiency feedback when correct

### AI Agent Integration
- [ ] Compiler Agent: Execute code and show output
- [ ] Evaluator Agent: Check correctness against testcases
- [ ] Efficiency Agent: Suggest improvements for correct solutions

### Validation
- [ ] Student login → No console errors
- [ ] Dashboard loads stats correctly
- [ ] Topics display properly
- [ ] Questions load by topic
- [ ] Problem page opens without errors
- [ ] Monaco editor initializes
- [ ] Code submission works end-to-end
- [ ] Test results display correctly

---

## 📌 Important Notes

### Backend Response Format
The `/student/performance` endpoint returns:
```python
{
  "error": False,
  "message": "Success",
  "data": {
    "performance": [
      {
        "student_id": "...",
        "question_id": "...",
        "status": "correct" | "incorrect" | "execution_error",
        "submitted_at": "2025-...",
        "efficiency_feedback": {...} | null,
        ...
      }
    ]
  }
}
```

### Frontend Must Handle
- Field names: `status`, `question_id`, `submitted_at`, `efficiency_feedback`
- Response structure: `response.data?.performance || response.performance`
- Null/undefined checks for all fields

---

## 🚨 What NOT To Do

❌ **Create new endpoints** - Use existing ones only
❌ **Call non-existent APIs** - This is what caused the 404
❌ **Use frameworks** - Vanilla HTML/CSS/JS only
❌ **Duplicate agent code** - Reuse existing agents in `agents/` folder
❌ **Add features not in CodePrac.MD** - Stick to requirements

---

## ✅ Final Validation

When student logs in:
1. Navigate to Dashboard → **No errors, stats display**
2. Navigate to Practice → **Topics load, no errors**
3. Click a topic → **Questions appear, no errors**
4. Click a question → **Problem page loads, editor ready**
5. Write code → **Monaco editor functional**
6. Click Run → **Output displays correctly**
7. Click Submit → **Results show (correct/incorrect)**
8. If correct → **Efficiency feedback appears**

