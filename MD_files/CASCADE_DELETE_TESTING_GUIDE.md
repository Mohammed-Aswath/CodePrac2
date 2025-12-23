# Cascading Delete - Testing Guide

## Quick Test Summary

This guide provides step-by-step instructions to test the cascading delete feature in your development environment.

## Setup

1. **Ensure Flask server is running:**
   ```bash
   cd D:\PRJJ
   python app.py
   ```
   
   Expected output:
   ```
   INFO:__main__:CODEPRAC 2.0 Flask app initialized
   Running on http://127.0.0.1:5000
   ```

2. **Have test data ready** (or create new test entities)

## Test Cases

### Test Case 1: Delete College with Full Hierarchy

**Objective:** Verify college deletion cascades through all dependent entities

**Steps:**
1. Create a test college:
   ```bash
   POST http://localhost:5000/api/admin/colleges
   {
     "name": "Test College",
     "email": "test.college@example.com",
     "password": "Test@123"
   }
   ```
   Save the returned `college_id`

2. Create 2 departments under this college
3. Create 3 batches under each department (6 total)
4. Create 5 students in each batch (30 total)
5. Create 2 questions per batch (12 total)

6. **Delete the college:**
   ```bash
   DELETE http://localhost:5000/api/admin/colleges/{college_id}
   Authorization: Bearer {admin_token}
   ```

**Expected Response:**
```json
{
  "error": false,
  "message": "College and XX dependent entities deleted successfully",
  "data": {
    "deleted_count": {
      "college": 1,
      "departments": 2,
      "batches": 6,
      "students": 30,
      "questions": 12,
      "notes": 0,
      "performance": 0
    }
  }
}
```

**Verification:**
- [ ] Response code: 200 OK
- [ ] `deleted_count.college` = 1
- [ ] `deleted_count.departments` = 2
- [ ] `deleted_count.batches` = 6
- [ ] `deleted_count.students` = 30
- [ ] `deleted_count.questions` = 12
- [ ] Query Firestore: College document should be deleted
- [ ] Query Firestore: All department documents should be deleted
- [ ] Query Firestore: All batch documents should be deleted
- [ ] Query Firestore: All student documents should be deleted
- [ ] Query Firestore: All question documents should be deleted

---

### Test Case 2: Delete Department with Batches and Students

**Objective:** Verify department deletion cascades correctly

**Steps:**
1. Create a test college
2. Create a test department:
   ```bash
   POST http://localhost:5000/api/college/departments
   {
     "name": "Test Department",
     "email": "test.dept@example.com",
     "password": "Test@123"
   }
   ```
   Save the returned `department_id`

3. Create 3 batches under this department
4. Create 10 students per batch (30 total)

5. **Delete the department:**
   ```bash
   DELETE http://localhost:5000/api/admin/departments/{dept_id}
   Authorization: Bearer {admin_token}
   ```

**Expected Response:**
```json
{
  "error": false,
  "message": "Department and XX dependent entities deleted successfully",
  "data": {
    "deleted_count": {
      "department": 1,
      "batches": 3,
      "students": 30,
      "questions": 0,
      "notes": 0,
      "performance": 0
    }
  }
}
```

**Verification:**
- [ ] Response code: 200 OK
- [ ] `deleted_count.department` = 1
- [ ] `deleted_count.batches` = 3
- [ ] `deleted_count.students` = 30
- [ ] Department and all batches and students deleted from Firestore
- [ ] Parent college still exists

---

### Test Case 3: Delete Batch with Students

**Objective:** Verify batch deletion cascades to students

**Steps:**
1. Create college, department, and batch with test data
2. Create 25 students in the batch
3. Create 10 questions for the batch

4. **Delete the batch:**
   ```bash
   DELETE http://localhost:5000/api/admin/batches/{batch_id}
   Authorization: Bearer {admin_token}
   ```

**Expected Response:**
```json
{
  "error": false,
  "message": "Batch and XX dependent entities deleted successfully",
  "data": {
    "deleted_count": {
      "batch": 1,
      "students": 25,
      "questions": 10,
      "notes": 0,
      "performance": 0
    }
  }
}
```

**Verification:**
- [ ] Batch deleted
- [ ] All 25 students deleted
- [ ] All 10 questions deleted
- [ ] Parent department still exists

---

### Test Case 4: Delete Student with Notes and Performance

**Objective:** Verify student deletion cascades to related records

**Steps:**
1. Create college → department → batch hierarchy
2. Create a student
3. Create 5 notes for the student
4. Create 20 performance records for the student

5. **Delete the student:**
   ```bash
   DELETE http://localhost:5000/api/admin/students/{student_id}
   Authorization: Bearer {admin_token}
   ```

**Expected Response:**
```json
{
  "error": false,
  "message": "Student and 2 related records deleted successfully",
  "data": {
    "deleted_count": {
      "student": 1,
      "notes": 5,
      "performance": 20
    }
  }
}
```

**Verification:**
- [ ] Student deleted
- [ ] All 5 notes deleted
- [ ] All 20 performance records deleted
- [ ] Parent batch and department still exist

---

### Test Case 5: Authorization - College Admin Delete Department

**Objective:** Verify college admin can only delete departments in their college

**Steps:**
1. Create 2 colleges
2. Create department in College A
3. Create department in College B
4. Login as College A admin

5. **Try to delete department from College B:**
   ```bash
   DELETE http://localhost:5000/api/college/departments/{college_b_dept_id}
   Authorization: Bearer {college_a_token}
   ```

**Expected Response:**
```json
{
  "error": true,
  "code": "NOT_FOUND",
  "message": "Department not found"
}
```

**Verification:**
- [ ] Response code: 404 Not Found
- [ ] Department B still exists in Firestore
- [ ] College A admin cannot access other college's departments

---

### Test Case 6: Authorization - Department Admin Delete Batch

**Objective:** Verify department admin can only delete batches in their department

**Steps:**
1. Create 2 departments
2. Create batch in Department A
3. Create batch in Department B
4. Login as Department A admin

5. **Try to delete batch from Department B:**
   ```bash
   DELETE http://localhost:5000/api/department/batches/{dept_b_batch_id}
   Authorization: Bearer {dept_a_token}
   ```

**Expected Response:**
```json
{
  "error": true,
  "code": "NOT_FOUND",
  "message": "Batch not found"
}
```

**Verification:**
- [ ] Response code: 404 Not Found
- [ ] Batch B still exists
- [ ] Department A admin cannot access other department's batches

---

### Test Case 7: Authorization - Batch Admin Delete Student

**Objective:** Verify batch admin can only delete students in their batch

**Steps:**
1. Create 2 batches
2. Create student in Batch A
3. Create student in Batch B
4. Login as Batch A admin

5. **Try to delete student from Batch B:**
   ```bash
   DELETE http://localhost:5000/api/batch/students/{batch_b_student_id}
   Authorization: Bearer {batch_a_token}
   ```

**Expected Response:**
```json
{
  "error": true,
  "code": "FORBIDDEN",
  "message": "Student does not belong to your batch"
}
```

**Verification:**
- [ ] Response code: 403 Forbidden
- [ ] Student B still exists
- [ ] Batch A admin cannot access other batch's students

---

### Test Case 8: Firebase User Disabling

**Objective:** Verify Firebase users are disabled during cascade

**Steps:**
1. Create college with department and batch
2. Note the Firebase UID of batch user
3. Delete the college
4. Try to login as batch user:
   ```bash
   POST http://localhost:5000/api/auth/login
   {
     "email": "batch.user@example.com",
     "password": "Password@123"
   }
   ```

**Expected Result:**
```json
{
  "error": true,
  "code": "AUTH_ERROR",
  "message": "User account is disabled"
}
```

**Verification:**
- [ ] User cannot login after cascade delete
- [ ] Firebase user still exists but is disabled
- [ ] User profile exists in Firebase but marked disabled

---

### Test Case 9: Audit Logging

**Objective:** Verify cascade operations are logged

**Steps:**
1. Delete a college
2. Check Firestore `audit_logs` collection
3. Find entry with:
   - `operation`: "delete_college_cascade"
   - `user_id`: {admin_uid}
   - `entity_id`: {college_id}

**Expected Log Entry:**
```json
{
  "user_id": "admin_uid_123",
  "operation": "delete_college_cascade",
  "entity_type": "college",
  "entity_id": "college_456",
  "timestamp": "2025-12-21T10:30:00Z",
  "metadata": {
    "deleted_count": {
      "college": 1,
      "departments": 2,
      "batches": 6,
      "students": 30,
      "questions": 12,
      "notes": 0,
      "performance": 0
    }
  }
}
```

**Verification:**
- [ ] Log entry created for cascade
- [ ] Correct user_id recorded
- [ ] Operation type is "delete_*_cascade"
- [ ] Metadata includes accurate deleted_count

---

### Test Case 10: Error Handling - Non-existent Entity

**Objective:** Verify proper error for non-existent entities

**Steps:**
1. **Try to delete non-existent college:**
   ```bash
   DELETE http://localhost:5000/api/admin/colleges/invalid_id
   Authorization: Bearer {admin_token}
   ```

**Expected Response:**
```json
{
  "error": true,
  "code": "NOT_FOUND",
  "message": "College not found"
}
```

**Verification:**
- [ ] Response code: 404 Not Found
- [ ] Clear error message
- [ ] No entities deleted

---

## Automated Test Script

Here's a script you can use to automate testing:

```bash
#!/bin/bash
BASE_URL="http://localhost:5000"
ADMIN_TOKEN="<your_admin_token>"

echo "Testing Cascade Delete Feature..."

# Test 1: Delete college
echo "Test 1: Deleting college..."
curl -X DELETE $BASE_URL/api/admin/colleges/test_college_id \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | python -m json.tool

# Test 2: Verify college deleted
echo "Test 2: Verifying college deleted..."
curl -X GET $BASE_URL/api/admin/colleges/test_college_id \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo "Tests complete!"
```

---

## Troubleshooting

### Issue: Cascade Delete Returns 500 Error
**Solution:**
1. Check Flask server logs for exceptions
2. Verify all imports in route files
3. Check Firestore connection
4. Ensure cascade_service.py is in project root

### Issue: Deleted Entities Still Appear in List
**Solution:**
1. Check if entities have `is_disabled = true` instead of being hard-deleted
2. Verify cascade_service is using `hard_delete()` not `delete()`
3. Check Firestore query filters include `is_disabled=false`

### Issue: Firebase Users Not Disabled
**Solution:**
1. Check Firebase authentication configuration
2. Verify `disable_user_firebase()` function is working
3. Check Firebase admin SDK credentials

### Issue: Audit Logs Missing
**Solution:**
1. Verify `audit_log()` function is imported in routes
2. Check Firestore permissions for audit_logs collection
3. Ensure `audit_log()` is called after cascade completes

---

## Performance Testing

### Large Scale Test
```
Create:
- 1 College
- 10 Departments
- 10 Batches per Department (100 total)
- 50 Students per Batch (5,000 total)
- 10 Questions per Batch (1,000 total)

Delete the college and measure time:
Expected: 5-10 seconds for ~6,100 entities
```

---

## Success Criteria

All of these should be TRUE after testing:
- ✅ Colleges can be deleted with all dependencies cascading
- ✅ Departments can be deleted with all dependencies cascading
- ✅ Batches can be deleted with all dependencies cascading
- ✅ Students can be deleted with related records cascading
- ✅ Authorization prevents unauthorized deletes
- ✅ Firebase users are disabled during cascade
- ✅ Audit logs record all cascade operations
- ✅ deleted_count is accurate in response
- ✅ No orphaned records remain after cascade
- ✅ Response time acceptable for typical hierarchies
