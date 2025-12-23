# Student Management - Step-by-Step Testing Guide

## Prerequisites

- Flask server running: `flask run --host=127.0.0.1 --port=5000`
- Admin account logged in
- Browser DevTools console open

---

## Test 1: Create Student

### Steps
1. Navigate to Admin Panel → Students tab
2. Verify: "Add Student" button appears at top
3. Click "Add Student" button
4. Modal opens with title "Add Student"
5. Verify fields exist:
   - Username (text input)
   - Email (email input)
   - Batch (dropdown select)
   - Password (password input, empty)

### Fill Form
```
Username: test_student_001
Email: test@college.edu
Batch: (select first enabled batch)
Password: (leave empty for auto-generation)
```

### Submit
6. Click "Create Student" button
7. Alert appears: "Student created successfully! Generated password: [12-char random]"
8. Modal closes
9. Table refreshes
10. New student appears in table with:
    - Username: test_student_001
    - Email: test@college.edu
    - Status: [Enabled] (green badge)
    - Actions: [Edit] [Disable] [Delete]

### Verify
- ✓ No console errors
- ✓ Student in table
- ✓ Status shows Enabled
- ✓ Password was auto-generated (shown in alert)

---

## Test 2: Edit Student

### Steps
1. In Students table, click "Edit" button on the student created above
2. Modal opens with title "Edit Student"
3. Verify fields are pre-filled:
   - Username: test_student_001
   - Email: test@college.edu
   - Batch: (shows selected batch)
   - Password: (empty - not shown for existing)

### Change Data
4. Change email: test_student_001@college.edu
5. Leave password empty (no change)
6. Click "Update Student" button

### Verify
7. Modal closes
8. Table refreshes
9. Student row shows new email: test_student_001@college.edu
10. Status unchanged: Enabled
11. Message appears: "Student updated"
12. No console errors

---

## Test 3: Disable Student

### Steps
1. In Students table, find the student created above
2. Verify Actions show: [Edit] [Disable] [Delete] (not [Enable])
3. Click "Disable" button
4. Confirmation dialog appears: "Disable this student? They will not be able to log in."

### Confirm
5. Click "Confirm" button (or "✓" checkmark)
6. Modal disappears
7. Table refreshes
8. Student row updates:
   - Status badge changes to: [Disabled] (gray)
   - Actions change to: [Edit] [Enable] [Delete]

### Verify
9. No console errors
10. Message: "Student disabled"
11. Button changed from Disable to Enable

---

## Test 4: Verify Disabled Student Cannot Login

### Setup
- Have the disabled student's credentials:
  - Email: test_student_001@college.edu
  - Password: (from auto-generated alert in Test 1)

### Steps
1. Logout from admin account
2. Go to Login page
3. Enter student credentials:
   ```
   Email: test_student_001@college.edu
   Password: [the auto-generated password]
   ```
4. Click "Login"

### Verify
5. Login fails with error message: "Your account has been disabled"
6. No error in console
7. Not logged in (still on login page)

---

## Test 5: Enable Student

### Steps
1. Go back to Admin Panel (may need to re-login as admin)
2. Go to Students tab
3. Find the disabled student (status shows [Disabled])
4. Verify Actions show: [Edit] [Enable] [Delete] (not [Disable])
5. Click "Enable" button

### Verify
6. No confirmation dialog (enable is reversible)
7. Table refreshes immediately
8. Student row updates:
   - Status badge changes to: [Enabled] (green)
   - Actions change to: [Edit] [Disable] [Delete]
9. Message: "Student enabled"

---

## Test 6: Verify Re-enabled Student Can Login

### Steps
1. Logout from admin account
2. Go to Login page
3. Enter enabled student credentials:
   ```
   Email: test_student_001@college.edu
   Password: [same auto-generated password]
   ```
4. Click "Login"

### Verify
5. Login succeeds
6. Redirected to student dashboard
7. Student can access platform
8. No console errors

---

## Test 7: Delete Student

### Steps
1. Go back to Admin Panel (logout student first)
2. Login as admin
3. Go to Students tab
4. Find the student created in Test 1
5. Click "Delete" button
6. Confirmation dialog appears: "Delete this student permanently? This action cannot be undone."

### Confirm
7. Click "Confirm" button
8. Modal disappears
9. Table refreshes
10. Student no longer in table

### Verify
11. Message: "Student deleted permanently"
12. No console errors
13. Student permanently removed from database

---

## Test 8: Batch Dropdown Filtering

### Steps
1. Create a batch and disable it (via Batches tab)
2. Go to Students tab
3. Click "Add Student"
4. Look at Batch dropdown
5. Verify:
   - Enabled batches appear: ✓ 2024-2025 (CS), ✓ 2024-2025 (ME), etc.
   - Disabled batches NOT appear: ✗ 2023-2024 (CS - disabled) not shown

### Verify
6. Re-enable the disabled batch (via Batches tab)
7. Refresh Students tab
8. Click "Add Student"
9. Disabled batch now appears in dropdown
10. Can select it

---

## Test 9: Form Validation

### Test 9a: Missing Username
1. Click "Add Student"
2. Leave Username empty
3. Fill Email, Batch, Password
4. Click "Create Student"
5. Error appears: "Username, email, and batch are required"
6. Modal stays open
7. Can fill and retry

### Test 9b: Missing Email
1. Click "Add Student"
2. Fill Username, Batch
3. Leave Email empty
4. Click "Create Student"
5. Error appears: "Username, email, and batch are required"

### Test 9c: Missing Batch
1. Click "Add Student"
2. Fill Username, Email
3. Leave Batch as "Select Batch"
4. Click "Create Student"
5. Error appears: "Username, email, and batch are required"

---

## Test 10: Actions Column Visibility

### Test 10a: Enabled Student
- Status: [Enabled] (green)
- Actions: [Edit] [Disable] [Delete]

### Test 10b: Disabled Student
- Status: [Disabled] (gray)
- Actions: [Edit] [Enable] [Delete]

### Verify
1. Create a student
2. Check status is Enabled and see [Disable] button
3. Click Disable
4. Check status is Disabled and see [Enable] button
5. Click Enable
6. Check status is Enabled and see [Disable] button again

---

## Test 11: Modal Reset on Add

### Steps
1. Edit a student (fill form with their data)
2. Close modal without saving
3. Click "Add Student" again
4. Verify all fields are EMPTY:
   - Username: blank
   - Email: blank
   - Batch: "Select Batch"
   - Password: blank
5. Modal title: "Add Student"
6. Button text: "Create Student"

---

## Test 12: Data Persistence

### Steps
1. Create Student A
2. Create Student B
3. Create Student C
4. Verify all 3 appear in table
5. Disable Student B
6. Refresh page
7. Verify:
   - All 3 still in table
   - Student B still disabled (status shows [Disabled])

---

## Test 13: Concurrent Actions

### Steps
1. Create Student A
2. Open edit modal for Student A
3. In separate browser tab, edit Student A (change email)
4. Back to first tab, change username
5. Click Update in first tab
6. Go to second tab, click Update

### Verify
- Last action wins
- Final state shows last update
- No database inconsistency

---

## Test 14: Console Error Check

### Throughout All Tests
- Open DevTools → Console tab
- Perform all tests above
- Verify: **Zero error messages** in console

Acceptable messages:
- Network requests to API
- Info/debug logs

Errors to flag:
- `Uncaught ReferenceError`
- `Cannot read property`
- `XMLHttpRequest failed`
- `Fetch error`

---

## Test 15: UI State Consistency

### After Each Operation
Verify UI reflects database state:

| Operation | UI State | Database State | Match |
|-----------|----------|---|---|
| Create | Student in table | Student in DB | ✓ |
| Update | Updated data shown | Updated in DB | ✓ |
| Disable | Status [Disabled] | is_disabled=true | ✓ |
| Enable | Status [Enabled] | is_disabled=false | ✓ |
| Delete | Removed from table | Removed from DB | ✓ |

---

## Expected Results Summary

| Test | Expected | Status |
|------|----------|--------|
| 1. Create | Student appears in table | ✓ |
| 2. Edit | Changes reflected in table | ✓ |
| 3. Disable | Status changes to Disabled | ✓ |
| 4. Login Disabled | "account disabled" error | ✓ |
| 5. Enable | Status changes to Enabled | ✓ |
| 6. Login Enabled | Login succeeds | ✓ |
| 7. Delete | Student removed from table | ✓ |
| 8. Batch Filter | Only enabled batches shown | ✓ |
| 9. Validation | Error messages appear | ✓ |
| 10. Actions | Buttons match status | ✓ |
| 11. Modal Reset | Form clears for new create | ✓ |
| 12. Persistence | Data survives refresh | ✓ |
| 13. Concurrent | Last action wins | ✓ |
| 14. Console | Zero errors | ✓ |
| 15. State | UI ↔ DB consistent | ✓ |

---

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify `Admin.editingStudentId` is set correctly
- Check modal HTML exists in index.html

### Batch dropdown empty
- Verify batches exist and are enabled
- Check admin is logged in
- Verify API call succeeds in Network tab

### Student doesn't appear after create
- Check API response in Network tab
- Verify student was created (check database)
- Try refreshing page

### Disable doesn't prevent login
- Verify `is_disabled=true` in database
- Check auth.py has the is_disabled check
- Verify user profile in Firestore has the field

### Console errors
- Check for typos in function names
- Verify all IDs match between HTML and JS
- Check Admin module is loaded

---

## Success Criteria

✅ All 15 tests pass
✅ Zero console errors
✅ UI matches database state
✅ Disabled students cannot login
✅ All CRUD operations work
✅ No schema mismatches
✅ Modal resets properly
✅ Batch dropdown filters correctly
