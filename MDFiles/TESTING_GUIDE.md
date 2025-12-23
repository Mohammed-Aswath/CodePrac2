# Schema Alignment Fix - Testing Guide

## Pre-Testing Checklist

Before running tests, verify:
- [ ] All code changes have been deployed to the application
- [ ] Browser cache cleared (or F12 → Network → Disable cache checked)
- [ ] Backend server running and accessible
- [ ] Firebase credentials properly configured
- [ ] Admin user logged in with proper permissions

---

## Manual Testing Plan

### Test 1: College Creation with Complete Schema

**Objective**: Verify college creation includes email and password

**Steps**:
1. Login as admin
2. Navigate to Admin Panel → Colleges tab
3. Click "Add College" button
4. Verify modal shows three fields:
   - Name (text input)
   - Email (email input)
   - Password (password input)
5. Fill in:
   - Name: `Test College 001`
   - Email: `testcol001@example.com`
   - Password: `TestPass123!`
6. Click "Create College"
7. Observe browser Network tab (F12):
   - Look for POST `/admin/colleges`
   - Check Request body contains: `name`, `email`, `password`
8. Expected outcome:
   - Success message displayed
   - College appears in list
   - Modal closes

**Pass Criteria**: 
- ✓ All three fields captured from form
- ✓ Payload sent to backend includes all three fields
- ✓ Backend accepts and creates college

---

### Test 2: Department Creation with Hierarchy

**Objective**: Verify department creation includes email, password, and college_id

**Prerequisites**: Test 1 must pass (college created)

**Steps**:
1. Admin Panel → Departments tab
2. Click "Add Department" button
3. Verify modal shows four fields in order:
   - College (dropdown selector)
   - Name (text input)
   - Email (email input)
   - Password (password input)
4. Fill in:
   - College: Select "Test College 001" from dropdown
   - Name: `Test Department 001`
   - Email: `testdept001@example.com`
   - Password: `TestPass123!`
5. Click "Create Department"
6. Observe Network tab:
   - Look for POST `/admin/departments`
   - Check Request body contains: `name`, `email`, `password`, `college_id`
   - Verify `college_id` matches selected college
7. Expected outcome:
   - Success message displayed
   - Department appears in list with college name
   - Modal closes

**Pass Criteria**:
- ✓ College dropdown populated with created college
- ✓ All four fields captured from form
- ✓ college_id automatically included in payload
- ✓ Backend accepts and creates department

---

### Test 3: Batch Creation with Automatic Derivation

**Objective**: Verify batch creation includes email, password, college_id, and department_id, with college_id auto-derived

**Prerequisites**: Tests 1-2 must pass (college and department created)

**Steps**:
1. Admin Panel → Batches tab
2. Click "Add Batch" button
3. Verify modal shows four fields in order:
   - Department (dropdown selector)
   - Name (text input)
   - Email (email input)
   - Password (password input)
4. Fill in:
   - Department: Select "Test Department 001" from dropdown
   - Name: `Test Batch 001`
   - Email: `testbatch001@example.com`
   - Password: `TestPass123!`
5. Click "Create Batch"
6. Observe Network tab:
   - Look for POST `/admin/batches`
   - Check Request body contains: `batch_name`, `email`, `password`, `college_id`, `department_id`
   - Verify `college_id` and `department_id` both present (college derived from department)
7. Expected outcome:
   - Success message displayed
   - Batch appears in list with department name
   - Modal closes

**Pass Criteria**:
- ✓ Department dropdown populated with created department
- ✓ college_id automatically derived from department
- ✓ All five fields captured in payload
- ✓ Backend accepts and creates batch

---

### Test 4: Student Creation with Full Hierarchy

**Objective**: Verify student creation derives college_id and department_id from batch

**Prerequisites**: Tests 1-3 must pass (college, department, batch created)

**Steps**:
1. Admin Panel → Students tab
2. Click "Add Student" button
3. Verify modal shows four fields:
   - Username (text input)
   - Email (email input)
   - Batch (dropdown selector)
   - Password (password input, optional)
4. Fill in:
   - Username: `teststudent001`
   - Email: `teststudent001@example.com`
   - Batch: Select "Test Batch 001" from dropdown
   - Password: (leave empty to test auto-generation)
5. Click "Create Student"
6. Observe Network tab:
   - Look for POST `/admin/students`
   - Check Request body contains: `username`, `email`, `batch_id`, `college_id`, `department_id`
   - Verify college_id and department_id derived from batch
7. Expected outcome:
   - Alert shows "Student created successfully! Generated password: [password]"
   - Student appears in list
   - Modal closes

**Pass Criteria**:
- ✓ Batch dropdown populated with created batch
- ✓ college_id and department_id automatically derived
- ✓ All required fields in payload
- ✓ Backend accepts and creates student with auto-generated password

---

### Test 5: Edit Operation Preserves All Fields

**Objective**: Verify edit operations pre-populate and preserve all required fields

**Prerequisites**: Test 1 must pass (college created)

**Steps**:
1. Admin Panel → Colleges tab
2. Find "Test College 001" in list
3. Click "Edit" button
4. Verify modal opens with all fields pre-populated:
   - Name: `Test College 001`
   - Email: `testcol001@example.com`
   - Password: `TestPass123!`
5. Modify Name to: `Test College 001 - Updated`
6. Click "Update College"
7. Observe Network tab:
   - Look for PUT `/admin/colleges/{id}`
   - Verify request body includes: `name`, `email`, `password` (all three fields)
8. Expected outcome:
   - Success message displayed
   - College name updated in list
   - Modal closes

**Pass Criteria**:
- ✓ Edit modal pre-populates all existing fields
- ✓ Email and password shown in edit form
- ✓ All fields included in PUT request (not just modified fields)
- ✓ Backend accepts and updates college

**Repeat this test for Department, Batch, and Student entities**

---

### Test 6: Validation of Required Fields

**Objective**: Verify frontend prevents submission of incomplete forms

**Steps**:
1. Admin Panel → Colleges tab
2. Click "Add College"
3. Modal opens with empty form
4. Do NOT fill any fields
5. Click "Create College" button
6. Expected: Alert shows "Please fill all required fields"
7. Fill only Name: `Test College`
8. Leave Email and Password empty
9. Click "Create College"
10. Expected: Alert shows "Please fill all required fields"
11. Fill Name and Email, leave Password empty
12. Click "Create College"
13. Expected: Alert shows "Please fill all required fields"

**Pass Criteria**:
- ✓ Submission blocked when any required field empty
- ✓ Clear error message shown to user
- ✓ Form remains open for correction

**Repeat for Department, Batch, and Student**

---

### Test 7: Hierarchy Validation

**Objective**: Verify system prevents invalid hierarchy selections

**Steps**:
1. Admin Panel → Batches tab
2. Click "Add Batch"
3. Do NOT select a department from dropdown
4. Fill other fields: Name, Email, Password
5. Click "Create Batch"
6. Expected: Alert shows error about invalid department

7. Select an invalid/non-existent department ID (if possible)
8. Fill Name, Email, Password
9. Click "Create Batch"
10. Expected: System shows error about missing college_id

**Pass Criteria**:
- ✓ Batch creation blocked without department selection
- ✓ Batch creation blocked if selected department has no college_id
- ✓ Clear error messages guide user to fix

**Repeat for Student (batch validation)**

---

## Automated Testing

### Run Backend Validation Tests

```bash
# Navigate to project directory
cd d:\PRJJ

# Run schema alignment tests
python test_schema_alignment.py
```

**Expected Output**:
- Tests for college, department, batch, student creation
- Tests for incomplete payload rejection
- All tests pass (green checkmarks)
- Summary shows: "ALL TESTS PASSED - Schema alignment verified!"

### Run Existing Test Suite

```bash
# Run current test suite
python -m pytest tests/ -v
```

**Expected**: No regressions; all existing tests still pass

---

## Browser DevTools Verification

### Method 1: Network Inspection

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR/Fetch
4. Create a college:
   - Find POST `/admin/colleges` request
   - Click on it
   - Go to "Payload" or "Request body" tab
   - Verify JSON shows: `{ "name": "...", "email": "...", "password": "..." }`

### Method 2: Local Storage/Session Inspection

1. Open DevTools → Application/Storage tab
2. Check Admin module state:
   - Admin.colleges should have full college objects
   - Each college should include: id, name, email, college_name, is_disabled, created_at

### Method 3: Console Logging

Add temporary logging to verify data flow:

```javascript
// Add to Admin.saveCollege() before API call
console.log("College Payload:", payload);
console.log("Sending to:", url);
```

---

## Database Verification (Firestore)

### Verify College Document
1. Firebase Console → Firestore Database
2. Navigate to `colleges` collection
3. Open created college document
4. Verify fields present:
   - `name`: "Test College 001"
   - `email`: "testcol001@example.com"
   - `password`: (hashed, won't see plaintext)
   - `id`: (auto-generated ID)
   - `created_at`: (timestamp)

### Verify Department Document
1. Navigate to `departments` collection
2. Open created department document
3. Verify fields present:
   - `name`: "Test Department 001"
   - `email`: "testdept001@example.com"
   - `college_id`: (matches college document ID)
   - All required fields present

### Verify Batch Document
1. Navigate to `batches` collection
2. Open created batch document
3. Verify fields present:
   - `batch_name`: "Test Batch 001"
   - `email`: "testbatch001@example.com"
   - `college_id`: (matches college)
   - `department_id`: (matches department)

### Verify Student Document
1. Navigate to `students` collection
2. Open created student document
3. Verify fields present:
   - `username`: "teststudent001"
   - `email`: "teststudent001@example.com"
   - `batch_id`: (matches batch)
   - `college_id`: (matches college)
   - `department_id`: (matches department)

---

## Performance Testing (Optional)

### Test API Response Times

```javascript
// In browser console
console.time("College Creation");
Admin.saveCollege();
console.timeEnd("College Creation");
```

**Expected**: Response time < 2 seconds for create operations

---

## Regression Testing

### Verify Existing Functionality

- [ ] Dropdown population works (populateCollegeSelect, etc.)
- [ ] List views show all entities
- [ ] Disable/Enable buttons work
- [ ] Delete buttons work
- [ ] Search/Filter functionality works (if implemented)
- [ ] Pagination works (if implemented)
- [ ] Role-based access control enforced
- [ ] Audit logs created for create/update/delete

---

## Test Results Summary Template

```
Test Name: College Creation with Complete Schema
Status: PASS / FAIL
Date: [Date]
Tester: [Name]
Notes: [Any observations]

Test Name: Department Creation with Hierarchy
Status: PASS / FAIL
Date: [Date]
Tester: [Name]
Notes: [Any observations]

Test Name: Batch Creation with Automatic Derivation
Status: PASS / FAIL
Date: [Date]
Tester: [Name]
Notes: [Any observations]

Test Name: Student Creation with Full Hierarchy
Status: PASS / FAIL
Date: [Date]
Tester: [Name]
Notes: [Any observations]

Test Name: Edit Operation Preserves All Fields
Status: PASS / FAIL
Date: [Date]
Tester: [Name]
Notes: [Any observations]

Test Name: Validation of Required Fields
Status: PASS / FAIL
Date: [Date]
Tester: [Name]
Notes: [Any observations]

Test Name: Hierarchy Validation
Status: PASS / FAIL
Date: [Date]
Tester: [Name]
Notes: [Any observations]

Overall Status: ALL TESTS PASSED / SOME TESTS FAILED
```

---

## Troubleshooting Test Failures

### If College Creation Fails

Check:
- [ ] Are all input fields visible in the modal?
- [ ] Does browser console show any JavaScript errors?
- [ ] Is the admin user properly authenticated?
- [ ] Does Network tab show the POST request being sent?
- [ ] Does the request include all three fields?

### If Batch Creation Fails with "Invalid department selected"

Check:
- [ ] Is the department dropdown populated with options?
- [ ] Does the selected department have a college_id in Firestore?
- [ ] Is the department selection being captured?
- [ ] Does Network tab show college_id in the payload?

### If Edit Operation Doesn't Pre-populate Fields

Check:
- [ ] Does the GET request fetch the document successfully?
- [ ] Are email and password fields present in the document?
- [ ] Does editDepartment() etc. have the field population code?
- [ ] Does browser console show any JavaScript errors?

### If Backend Rejects the Request

Check:
- [ ] Does the error message indicate missing fields?
- [ ] Are all required fields in the payload?
- [ ] Are field names matching backend expectations?
- [ ] Is the payload valid JSON?

---

## Sign-Off

Once all tests pass, record:
- Date: ___________
- Tester: ___________
- Browser/Version: ___________
- Backend Status: Online / Offline
- All Tests: PASSED / FAILED

