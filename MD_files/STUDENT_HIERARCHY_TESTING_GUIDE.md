# Student Hierarchy Fix - Testing Guide

## 🧪 Manual Testing Procedure

### Test 1: CSV Format Validation

**Objective**: Verify CSV parser rejects incomplete hierarchy

**Test Case 1A: Missing college_id Column**
```
Filename: students_missing_college.csv
Content:
username,email,password,department_id,batch_id
john_doe,john@college.edu,SecurePass123,dept_001,batch_2024
```

**Expected Result**: 
```
❌ Error: "CSV must have exactly these columns: batch_id, college_id, department_id, email, password, username"
```

**Test Case 1B: Row with Empty college_id**
```
Filename: students_empty_college.csv
Content:
username,email,password,college_id,department_id,batch_id
john_doe,john@college.edu,SecurePass123,,dept_001,batch_2024
```

**Expected Result**:
```
❌ Error: "Row 2: college_id is required and cannot be empty"
```

**Test Case 1C: Correct CSV Format**
```
Filename: students_valid.csv
Content:
username,email,password,college_id,department_id,batch_id
john_doe,john@college.edu,SecurePass123,college_001,dept_001,batch_2024
jane_smith,jane@college.edu,SecurePass456,college_001,dept_001,batch_2024
```

**Expected Result**:
```
✅ Success: "CSV parsed successfully with 2 students"
```

---

### Test 2: Batch Upload Hierarchy Injection

**Objective**: Verify batch upload adds college_id and department_id from batch record

**Prerequisites**:
1. Create a batch with college_id and department_id set
2. Log in as batch user
3. Have a valid student CSV with just username, email, password

**Test Steps**:
1. Navigate to batch dashboard
2. Upload CSV with students
3. Check created student records in admin table

**Expected Result**:
```
Student table shows:
- Username: john_doe ✓
- Email: john@college.edu ✓
- College: [College Name] ✓ (NOT "N/A")
- Department: [Department Name] ✓ (NOT "N/A")
- Batch: [Batch Name] ✓
```

**Verification Query** (Check Firestore):
```
Document: students/{student_id}
Fields:
  - college_id: college_001 ✓
  - department_id: dept_001 ✓
  - batch_id: batch_2024 ✓
```

---

### Test 3: Department Upload Scope Validation

**Objective**: Verify department upload validates CSV hierarchy matches auth scope

**Test Case 3A: Mismatched College ID**
```
Department: dept_001 (in college_abc)
CSV Content:
username,email,password,college_id,department_id,batch_id
john_doe,john@college.edu,Pass123,college_xyz,dept_001,batch_2024
```

**Expected Result**:
```
❌ Error: "Row 2: college_id 'college_xyz' doesn't match your college 'college_abc'"
```

**Test Case 3B: Mismatched Department ID**
```
Department: dept_001 (in college_abc)
CSV Content:
username,email,password,college_id,department_id,batch_id
john_doe,john@college.edu,Pass123,college_abc,dept_999,batch_2024
```

**Expected Result**:
```
❌ Error: "Row 2: department_id 'dept_999' doesn't match your department 'dept_001'"
```

**Test Case 3C: Correct Scoped CSV**
```
Department: dept_001 (in college_abc)
CSV Content:
username,email,password,college_id,department_id,batch_id
john_doe,john@college.edu,Pass123,college_abc,dept_001,batch_2024
```

**Expected Result**:
```
✅ Success: "Created 1 students"
Student created with college_id=college_abc, department_id=dept_001
```

---

### Test 4: Frontend Hierarchy Guard

**Objective**: Verify frontend blocks practice access if hierarchy incomplete

**Test Case 4A: Complete Hierarchy**
```
User: student_001
Profile:
  - college_id: college_abc ✓
  - department_id: dept_001 ✓
  - batch_id: batch_2024 ✓
```

**Action**: Click "Practice" button

**Expected Result**:
```
✅ Topics page loads
Topics visible from department
No error messages
```

**Test Case 4B: Missing Department ID**
```
User: student_002
Profile:
  - college_id: college_abc ✓
  - department_id: (undefined) ✗
  - batch_id: batch_2024 ✓
```

**Action**: Click "Practice" button

**Expected Result**:
```
❌ Error displayed: "Your student account is incomplete. Missing: department. 
Please contact your department administrator to complete your profile."

Topics page does NOT load
Practice is blocked
```

**Test Case 4C: Missing All Hierarchy**
```
User: student_003
Profile:
  - college_id: (undefined) ✗
  - department_id: (undefined) ✗
  - batch_id: (undefined) ✗
```

**Action**: Click "Practice" button

**Expected Result**:
```
❌ Error displayed: "Your student account is incomplete. Missing: college, department, batch. 
Please contact your department administrator to complete your profile."

Practice blocked
Console logs: Student hierarchy incomplete: {college_id: undefined, department_id: undefined, batch_id: undefined}
```

---

### Test 5: End-to-End Student Practice Flow

**Objective**: Verify complete student journey works without errors

**Prerequisites**:
1. Create a college (college_abc)
2. Create a department (dept_001 under college_abc)
3. Create a batch (batch_2024 under dept_001)
4. Create topics for dept_001
5. Create questions for batch_2024

**Test Steps**:

1. **Upload Student via CSV**
   ```csv
   username,email,password,college_id,department_id,batch_id
   test_student,test@example.com,TestPass123,college_abc,dept_001,batch_2024
   ```
   ✅ Expected: Student created with all hierarchy

2. **Login as Student**
   ```
   Email: test@example.com
   Password: TestPass123
   ```
   ✅ Expected: Login succeeds, dashboard loads

3. **Navigate to Practice**
   ```
   Click "Practice" tab
   ```
   ✅ Expected: No error, topics page loads

4. **Load Topics**
   ```
   GET /api/student/topics
   ```
   ✅ Expected: 200 OK, topics from dept_001 returned

5. **Select Topic**
   ```
   Click a topic
   ```
   ✅ Expected: Questions for that topic display

6. **Load Question**
   ```
   Click a question
   ```
   ✅ Expected: Problem page opens, no 404

7. **Run Code**
   ```
   Enter code + click "Run Code"
   ```
   ✅ Expected: Code executes, output displays

8. **Submit Solution**
   ```
   Click "Submit"
   ```
   ✅ Expected: Evaluated against testcases, results show

---

### Test 6: Admin Table Display

**Objective**: Verify admin table shows correct hierarchy (no "N/A")

**Test Steps**:
1. Go to Admin Panel → Students tab
2. Verify student created via CSV

**Expected Display**:
```
┌─────────────┬──────────────────┬──────────────┬──────────────┬──────────┬────────┐
│ Username    │ Email            │ College      │ Department   │ Batch    │ Status │
├─────────────┼──────────────────┼──────────────┼──────────────┼──────────┼────────┤
│ test_studen │ test@example.com │ College ABC  │ AI & ML      │ 2024-26  │ ✓      │
│ john_doe    │ john@college.edu │ College ABC  │ CS Dept      │ 2024-28  │ ✓      │
└─────────────┴──────────────────┴──────────────┴──────────────┴──────────┴────────┘
```

❌ **WRONG** (Before Fix):
```
College: N/A
Department: N/A
```

✅ **CORRECT** (After Fix):
```
College: College ABC (or name from lookup)
Department: AI & ML (or name from lookup)
```

---

### Test 7: Batch Upload Scenario

**Objective**: Test batch user uploading students directly

**Prerequisites**:
1. Create batch with college_id and department_id set
2. Create batch user with batch role

**Test Steps**:
1. Login as batch user
2. Go to batch dashboard → Students
3. Upload JSON payload:
   ```json
   {
     "students": [
       {
         "name": "Alice Wilson",
         "email": "alice@example.com",
         "password": "AlicePass123"
       },
       {
         "name": "Bob Jones",
         "email": "bob@example.com",
         "password": "BobPass123"
       }
     ]
   }
   ```

**Expected Result**:
```
✅ Created 2 students
Both students have:
  - college_id: [from batch]
  - department_id: [from batch]
  - batch_id: [batch_id]
```

**Verify in Admin**:
- Both students visible
- College column shows correct college name
- Department column shows correct department name
- No "N/A" values

---

### Test 8: Incomplete Batch Error

**Objective**: Verify error if batch missing hierarchy

**Setup**:
1. Create batch WITHOUT setting college_id or department_id
2. Try to upload students to it

**Expected Result**:
```
❌ Error: "Batch is missing college_id. Contact administrator."
or
❌ Error: "Batch is missing department_id. Contact administrator."
```

**Batch must be fixed by admin** (set college_id and department_id) before students can be uploaded.

---

## 🔍 Debugging Checklist

### If Student Practice Shows Error

**Step 1: Check Student Record**
```javascript
// In browser console, after login
const user = Auth.getCurrentUser();
console.log('Student data:', user);
// Should show: college_id, department_id, batch_id
```

**Step 2: Check Admin Table**
```
- Navigate to Admin Panel → Students
- Find the student
- Verify College and Department columns show actual names (not "N/A")
```

**Step 3: Check Firestore**
```
Collection: students
Document: {student_id}
Required fields:
  ✓ college_id
  ✓ department_id
  ✓ batch_id
```

**Step 4: Check Firebase User Profile**
```
Collection: User
Document: {firebase_uid}
Required fields:
  ✓ college_id
  ✓ department_id
  ✓ batch_id
  ✓ role: "student"
```

### If CSV Upload Fails

**Check**: CSV columns
```
Verify all 6 columns present:
  ✓ username
  ✓ email
  ✓ password
  ✓ college_id
  ✓ department_id
  ✓ batch_id
```

**Check**: Row data
```
Verify no empty cells in:
  ✓ college_id
  ✓ department_id
  ✓ batch_id
```

**Check**: Scope validation (Department upload)
```
Verify CSV hierarchy matches authenticated user:
  ✓ college_id in CSV == user's college_id
  ✓ department_id in CSV == user's department_id
  ✓ batch_id in CSV == selected batch_id
```

---

## 📊 Success Criteria

All tests pass when:

1. ✅ CSV parser validates all 6 columns required
2. ✅ CSV parser rejects incomplete rows
3. ✅ Batch upload injects college_id and department_id
4. ✅ Department upload validates scope
5. ✅ Frontend guard prevents incomplete access
6. ✅ Student table shows all hierarchy (no N/A)
7. ✅ `/student/topics` returns 200 OK
8. ✅ Practice page loads without errors
9. ✅ Batch missing hierarchy shows clear error
10. ✅ No 400 "Student not assigned to department"

---

## 🚀 Running All Tests

```bash
# Test CSV parsing
python test_csv_parsing.py

# Test student creation
python test_student_creation.py

# Test practice flow
python test_practice_flow.py

# Manual browser testing
1. Open app in browser
2. Go through tests 1-8 above
3. Verify all scenarios
```

---

## ✅ Sign-Off

When all tests pass:
- [x] CSV format enforced
- [x] Hierarchy validation working
- [x] Frontend guard protecting access
- [x] Student table displaying correctly
- [x] No partial students in database
- [x] Complete student practice flow working
- [x] Zero 400 errors from missing hierarchy

**Status**: Ready for production ✅

