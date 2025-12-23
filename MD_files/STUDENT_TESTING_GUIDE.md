# Student Flow - Integration & Testing Guide

## 🎯 Quick Start for Testing

### Prerequisites
- Flask backend running on http://localhost:5000
- Frontend loaded in browser
- Student account created via Admin panel

### Test Path (Step by Step)

#### 1. Login as Student
```
URL: http://localhost:5000/index.html
Username: (any student email)
Password: (student password)
Expected: Dashboard page loads without errors
```

#### 2. Check Dashboard
```
Navigate to: Dashboard
Expected Results:
  ✓ No console errors
  ✓ 4 stat cards visible (Total Submissions, Questions Solved, Unique Attempted, Success Rate)
  ✓ Recent activity table shows (5 most recent submissions or "No recent activity")
  ✓ Status badges show correctly (green for correct, orange for incorrect, red for error)
  ✓ Dates format properly
```

#### 3. Navigate to Practice
```
Navigate to: Practice (from navigation bar)
Expected Results:
  ✓ Topics list appears
  ✓ Each topic shows name and description
  ✓ No console errors
  ✓ Topics load from /student/topics endpoint
```

#### 4. Select a Topic
```
Action: Click any topic
Expected Results:
  ✓ Questions for that topic display
  ✓ "Back to Topics" button appears
  ✓ Questions show title and difficulty badge
  ✓ No errors in console
```

#### 5. Select a Question
```
Action: Click any question
Expected Results:
  ✓ LeetCode-style problem page appears
  ✓ Problem statement visible with title
  ✓ Description in highlighted box
  ✓ Example input/output side-by-side (if available)
  ✓ Language selector shows options (Python, JavaScript, Java, C++)
  ✓ Code editor has dark background, monospace font
  ✓ Three action buttons: Run Code, Submit, (Check Efficiency if correct)
  ✓ Custom test input textarea visible
```

#### 6. Run Code
```
Action: 
  1. Enter some Python code in editor
  2. (Optional) Enter test input
  3. Click "Run Code" button
Expected Results:
  ✓ Code executes via compiler agent
  ✓ Output displays in results section
  ✓ No 404 or other errors
  ✓ Results show execution status
```

#### 7. Submit Code
```
Action:
  1. Enter code
  2. Click "Submit" button
Expected Results:
  ✓ Code evaluated against all testcases
  ✓ Status shows (Correct/Incorrect/Error)
  ✓ Evaluation reason displayed
  ✓ If correct: "⚡ Check Efficiency" button appears
  ✓ No errors in console
```

#### 8. Check Efficiency (Only if Solution Correct)
```
Action: Click "⚡ Check Efficiency" button
Expected Results:
  ✓ Alert shows efficiency feedback:
    - Time Complexity
    - Space Complexity
    - Approach summary
    - Improvement suggestions
    - Optimal method
  ✓ No errors
```

---

## 🔍 Console Validation

After completing all tests, check browser console (F12 → Console tab):

### ✅ Expected: No errors
```
(console should be clean or only have info logs)
```

### ❌ Unexpected: These errors should NOT appear
```
404 /api/student/submissions
TypeError: Cannot read property 'xxx' of undefined
ReferenceError: xxx is not defined
CORS error
Failed to parse JSON
```

---

## 📡 API Endpoint Verification

### Test Each Endpoint Directly

#### 1. Test Dashboard Endpoint
```
curl -X GET http://localhost:5000/api/student/performance \
  -H "Authorization: Bearer <TOKEN>"

Expected Response:
{
  "error": false,
  "message": "Success",
  "data": {
    "performance": [
      {
        "student_id": "...",
        "question_id": "...",
        "status": "correct|incorrect|execution_error",
        "submitted_at": "2025-...",
        ...
      }
    ]
  }
}
```

#### 2. Test Topics Endpoint
```
curl -X GET http://localhost:5000/api/student/topics \
  -H "Authorization: Bearer <TOKEN>"

Expected Response:
{
  "error": false,
  "message": "Success",
  "data": {
    "topics": [
      {
        "id": "...",
        "name": "Topic Name",
        "description": "...",
        ...
      }
    ]
  }
}
```

#### 3. Test Questions Endpoint
```
curl -X GET http://localhost:5000/api/student/questions \
  -H "Authorization: Bearer <TOKEN>"

Expected Response:
{
  "error": false,
  "message": "Success",
  "data": {
    "questions": [
      {
        "id": "...",
        "title": "Question Title",
        "difficulty": "easy|medium|hard",
        "topic": "Topic Name",
        ...
      }
    ]
  }
}
```

#### 4. Test Submit Endpoint
```
curl -X POST http://localhost:5000/api/student/submit \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q1",
    "code": "def solve(x):\n    return x + 1",
    "language": "python"
  }'

Expected Response:
{
  "error": false,
  "message": "Success",
  "data": {
    "status": "correct|incorrect|execution_error",
    "test_results": {
      "is_correct": true|false,
      "reason": "explanation"
    },
    "efficiency_feedback": {
      "time_complexity": "...",
      "space_complexity": "...",
      ...
    } or null
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Dashboard shows "No recent activity" but I've submitted code

**Cause**: Submissions not saved or status field mismatch

**Fix**:
1. Check browser Network tab for `/student/performance` response
2. Verify response contains `performance` array with submissions
3. Check if `status` field is one of: `correct`, `incorrect`, `execution_error`

### Issue: Topics don't load

**Cause**: Student not assigned to a department, or no topics in department

**Fix**:
1. Check in Admin panel that student is assigned to department
2. Check in Department panel that topics exist
3. Check console for error message from `/student/topics` endpoint

### Issue: Code submission returns error

**Cause**: Question ID mismatch or missing field in request

**Fix**:
1. Verify question_id is valid UUID from `/student/questions`
2. Ensure code field is not empty
3. Ensure language is one of: python, javascript, java, cpp
4. Check backend logs for detailed error

### Issue: Results not displaying after submission

**Cause**: Response parsing issue or missing fields

**Fix**:
1. Check Network tab response from `/student/submit`
2. Verify response has `status` and `test_results` fields
3. Check console for parsing errors
4. Ensure `submitted_at` field is timestamp if used

---

## 📊 Test Data Setup

### For Manual Testing

#### 1. Create College
- Admin → Colleges tab
- Add College: "Test College"

#### 2. Create Department
- Admin → Departments tab
- College: "Test College"
- Add Department: "Test Department"

#### 3. Create Batch
- Admin → Batches tab
- College: "Test College"
- Department: "Test Department"
- Add Batch: "Test Batch 2024"

#### 4. Create Student
- Admin → Students tab
- College: "Test College"
- Department: "Test Department"
- Batch: "Test Batch 2024"
- Username: "student1"
- Email: "student1@test.com"
- Password: "Password123"

#### 5. Create Topic
- Department Dashboard
- Create Topic: "Arrays", "String Manipulation", etc.

#### 6. Create Questions
- Department Dashboard
- For each topic:
  - Create Question: "Two Sum", "Palindrome", etc.
  - Set difficulty
  - Add description and examples
  - System will generate testcases

#### 7. Login as Student
- Use student credentials from step 4
- Should see topics from step 5
- Should see questions from step 6

---

## ✅ Final Validation Checklist

Before declaring done, verify:

### Backend Endpoints
- [ ] `/student/topics` returns topics for student's department
- [ ] `/student/questions` returns questions for student's batch
- [ ] `/student/submit` accepts POST and returns correct response format
- [ ] `/student/performance` returns submission history

### Frontend Dashboard
- [ ] Dashboard loads without 404 errors
- [ ] Stats cards display calculated values
- [ ] Recent activity table shows submissions
- [ ] Status badges show with correct colors

### Student Practice
- [ ] Topics display for student's department
- [ ] Clicking topic loads questions for that topic
- [ ] Clicking question opens problem page
- [ ] Problem page has all required sections

### Problem Page
- [ ] Problem statement visible
- [ ] Language selector works
- [ ] Code editor accepts input
- [ ] "Run Code" button works and shows output
- [ ] "Submit" button works and evaluates code
- [ ] Results display with correct status

### AI Integration
- [ ] Compiler agent executes code correctly
- [ ] Evaluator agent checks testcases
- [ ] Efficiency agent provides feedback when correct
- [ ] All agent responses parse and display properly

### Error Handling
- [ ] No 404 errors in Network tab
- [ ] No console errors (except intentional logs)
- [ ] All API calls return expected response format
- [ ] Null checks prevent undefined errors

---

## 🚀 Performance Considerations

### Response Times Expected
- Dashboard load: < 2 seconds
- Topics load: < 1 second
- Questions load: < 1 second
- Code execution (Run): < 10 seconds (depends on agent)
- Code submission (Submit): < 15 seconds (all testcases)

### If Slow
1. Check network latency (Network tab)
2. Check backend logs for processing time
3. Verify question doesn't have 1000+ testcases
4. Check Groq API rate limits (efficiency agent)

---

## 📝 Logging & Debugging

### Enable Detailed Logging

In `js/utils.js` or console:
```javascript
// Enable verbose API logging
Utils.DEBUG = true;

// Then API calls will log request/response
```

### Check Backend Logs

When running Flask:
```bash
flask run --debug
# Watch for:
# - Student endpoint calls
# - Agent wrapper calls
# - Firestore operations
# - Any exceptions
```

### Check Network Tab

Browser DevTools → Network tab:
1. Filter by XHR (XML HttpRequest)
2. Look for API calls to `/api/student/*`
3. Check:
   - Status code (should be 200, not 404)
   - Response body (correct format)
   - Request payload (correct fields)

---

## 📞 Support

If issues persist:

1. **Verify setup**:
   - Flask running on correct port
   - Frontend HTML loaded
   - Auth token valid

2. **Check logs**:
   - Browser console
   - Backend Flask logs
   - Network tab responses

3. **Validate data**:
   - Student assigned to batch
   - Batch assigned to department
   - Questions exist in batch
   - Topics exist in department

4. **Test endpoints**:
   - Use curl/Postman
   - Verify each endpoint works individually
   - Check response format matches documentation

