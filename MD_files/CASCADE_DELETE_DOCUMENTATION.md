# Cascading Delete Feature Documentation

## Overview

The cascading delete feature ensures data integrity by automatically deleting all dependent entities when a parent entity is deleted. This maintains the hierarchical relationship structure and prevents orphaned records.

## Hierarchy Structure

```
College (Root)
├── Department
│   ├── Batch
│   │   ├── Student
│   │   │   ├── Notes
│   │   │   └── Performance Records
│   │   └── Questions
│   └── Questions
└── Questions
```

## Delete Cascade Rules

### 1. When a College is Deleted
- ✅ All departments in that college are deleted
- ✅ All batches in those departments are deleted
- ✅ All students in those batches are deleted
- ✅ All questions for those batches are deleted
- ✅ All notes created by those students are deleted
- ✅ All performance records of those students are deleted
- ✅ All Firebase users associated with these entities are disabled

**Affected Entities Count:**
```
{
  "college": 1,
  "departments": <number>,
  "batches": <number>,
  "students": <number>,
  "questions": <number>,
  "notes": <number>,
  "performance": <number>
}
```

### 2. When a Department is Deleted
- ✅ All batches in that department are deleted
- ✅ All students in those batches are deleted
- ✅ All questions for those batches are deleted
- ✅ All notes created by those students are deleted
- ✅ All performance records of those students are deleted
- ✅ All Firebase users associated with these entities are disabled

**Affected Entities Count:**
```
{
  "department": 1,
  "batches": <number>,
  "students": <number>,
  "questions": <number>,
  "notes": <number>,
  "performance": <number>
}
```

### 3. When a Batch is Deleted
- ✅ All students in that batch are deleted
- ✅ All questions for that batch are deleted
- ✅ All notes created by those students are deleted
- ✅ All performance records of those students are deleted
- ✅ All Firebase users associated with these entities are disabled

**Affected Entities Count:**
```
{
  "batch": 1,
  "students": <number>,
  "questions": <number>,
  "notes": <number>,
  "performance": <number>
}
```

### 4. When a Student is Deleted
- ✅ All notes created by that student are deleted
- ✅ All performance records of that student are deleted
- ✅ Firebase user associated with the student is disabled

**Affected Entities Count:**
```
{
  "student": 1,
  "notes": <number>,
  "performance": <number>
}
```

## API Endpoints

### Admin Endpoints (Super Admin Only)

#### Delete College
```http
DELETE /api/admin/colleges/<college_id>
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "error": false,
  "message": "College and 45 dependent entities deleted successfully",
  "data": {
    "deleted_count": {
      "college": 1,
      "departments": 3,
      "batches": 8,
      "students": 125,
      "questions": 42,
      "notes": 250,
      "performance": 500
    }
  }
}
```

#### Delete Department
```http
DELETE /api/admin/departments/<dept_id>
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "error": false,
  "message": "Department and 44 dependent entities deleted successfully",
  "data": {
    "deleted_count": {
      "department": 1,
      "batches": 4,
      "students": 80,
      "questions": 32,
      "notes": 160,
      "performance": 400
    }
  }
}
```

#### Delete Batch
```http
DELETE /api/admin/batches/<batch_id>
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "error": false,
  "message": "Batch and 13 dependent entities deleted successfully",
  "data": {
    "deleted_count": {
      "batch": 1,
      "students": 45,
      "questions": 12,
      "notes": 90,
      "performance": 100
    }
  }
}
```

#### Delete Student
```http
DELETE /api/admin/students/<student_id>
Authorization: Bearer <admin_token>
```

**Response:**
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

### College Endpoints (College Admin)

#### Delete Department (within college)
```http
DELETE /api/college/departments/<dept_id>
Authorization: Bearer <college_token>
```

**Authorization:** Can only delete departments in their own college

#### Delete Batch (within college)
```http
DELETE /api/college/batches/<batch_id>
Authorization: Bearer <college_token>
```

**Authorization:** Can only delete batches in their own college

#### Delete Student (within college)
```http
DELETE /api/college/students/<student_id>
Authorization: Bearer <college_token>
```

**Authorization:** Can only delete students in their own college

### Department Endpoints (Department Admin)

#### Delete Batch (within department)
```http
DELETE /api/department/batches/<batch_id>
Authorization: Bearer <department_token>
```

**Authorization:** Can only delete batches in their own department

#### Delete Student (within department)
```http
DELETE /api/department/students/<student_id>
Authorization: Bearer <department_token>
```

**Authorization:** Can only delete students in their own department

### Batch Endpoints (Batch Admin)

#### Delete Student (within batch)
```http
DELETE /api/batch/students/<student_id>
Authorization: Bearer <batch_token>
```

**Authorization:** Can only delete students in their own batch

## Implementation Details

### Service Class: `CascadeService`

Located in `cascade_service.py`

#### Methods

##### `delete_college_cascade(college_id, user_id)`
- Deletes college and all dependent entities
- Returns: `(success: bool, message: str, deleted_count: dict)`
- Audit logged as "delete_college_cascade"

##### `delete_department_cascade(dept_id, user_id, cascade_from_college=False)`
- Deletes department and all dependent entities
- `cascade_from_college=True` prevents duplicate auditing when called from college delete
- Returns: `(success: bool, message: str, deleted_count: dict)`
- Audit logged as "delete_department_cascade" only if not cascading from college

##### `delete_batch_cascade(batch_id, user_id, cascade_from_dept=False)`
- Deletes batch and all dependent entities
- `cascade_from_dept=True` prevents duplicate auditing when called from department delete
- Returns: `(success: bool, message: str, deleted_count: dict)`
- Audit logged as "delete_batch_cascade" only if not cascading from department

##### `delete_student_cascade(student_id, user_id)`
- Deletes student and all related records
- Returns: `(success: bool, message: str, deleted_count: dict)`
- Audit logged as "delete_student_cascade"

### Database Operations

All delete operations use the `hard_delete()` method which:
- Permanently removes documents from Firestore
- Cannot be undone
- Should be confirmed by user before executing

### Firebase User Handling

When entities with Firebase users are deleted:
- Firebase user is disabled via `disable_user_firebase()`
- User cannot login after deletion
- User data is not removed from Firebase Authentication

### Audit Logging

All cascade delete operations are logged with:
- `user_id`: Who initiated the delete
- `operation`: "delete_college_cascade" | "delete_department_cascade" | "delete_batch_cascade" | "delete_student_cascade"
- `entity_type`: "college" | "department" | "batch" | "student"
- `entity_id`: ID of the entity being deleted
- `metadata`: Contains `deleted_count` showing what was deleted

## Error Handling

### Common Errors

#### NOT_FOUND
```json
{
  "error": true,
  "code": "NOT_FOUND",
  "message": "College not found"
}
```

#### DELETE_ERROR
```json
{
  "error": true,
  "code": "DELETE_ERROR",
  "message": "Error message from service"
}
```

#### FORBIDDEN (for non-admin deletes)
```json
{
  "error": true,
  "code": "FORBIDDEN",
  "message": "Department not found or doesn't belong to your college"
}
```

## Frontend Integration

### Delete Confirmation Dialog

Before performing cascade deletes, the frontend should:

1. **Show Warning Dialog**
   - Display entity name being deleted
   - Show count of dependent entities affected
   - List entity types being deleted

2. **Example Dialog Content**
   ```
   Warning: Delete College "Engineering"?
   
   This will permanently delete:
   - 3 Departments
   - 8 Batches
   - 125 Students
   - 42 Questions
   - 250 Notes
   - 500 Performance Records
   
   This action CANNOT be undone.
   
   [Cancel] [Delete All]
   ```

3. **Handle Response**
   - Display count of deleted entities
   - Refresh list view
   - Navigate away if parent entity deleted

### Frontend Delete Methods

```javascript
// Example frontend delete for college
async function deleteCollege(collegeId) {
  // 1. Fetch entity details to show dependencies
  const college = await Utils.apiRequest(`/api/admin/colleges/${collegeId}`, 'GET');
  
  // 2. Show confirmation dialog
  const confirmed = await showDeleteConfirmation({
    entityType: 'College',
    entityName: college.name,
    dependentTypes: ['Departments', 'Batches', 'Students', 'Questions', 'Notes']
  });
  
  if (!confirmed) return;
  
  // 3. Perform deletion
  const response = await Utils.apiRequest(`/api/admin/colleges/${collegeId}`, 'DELETE');
  
  // 4. Show result
  if (response.error) {
    showError(response.message);
  } else {
    showSuccess(`College deleted. ${JSON.stringify(response.data.deleted_count)} entities removed.`);
    // Refresh list
    loadColleges();
  }
}
```

## Testing Scenarios

### Test Case 1: Delete College with Full Hierarchy
1. Create College "Test College"
2. Create 2 Departments under it
3. Create 3 Batches in each department (6 total)
4. Create 10 Students in each batch (60 total)
5. Create 5 Questions per batch (30 total)
6. Create 2 Notes per student (120 total)
7. Create 10 Performance records per student (600 total)
8. Delete the college
9. Verify: All 819 entities deleted, deleted_count matches

### Test Case 2: Delete Department
1. Create Department with hierarchy
2. Create multiple dependent entities
3. Delete department
4. Verify: All dependent entities deleted
5. Verify: College still exists and is unaffected
6. Verify: Other departments in same college unaffected

### Test Case 3: Delete Batch
1. Create Batch with students and questions
2. Delete batch
3. Verify: All students and questions deleted
4. Verify: Department and college unaffected

### Test Case 4: Delete Student
1. Create Student with notes and performance
2. Delete student
3. Verify: Notes and performance deleted
4. Verify: Batch unaffected
5. Verify: Other students unaffected

### Test Case 5: Authorization Testing
1. College admin tries to delete department from other college
   - Should get 404 Not Found
2. Department admin tries to delete batch from other department
   - Should get 404 Not Found
3. Batch admin tries to delete student from other batch
   - Should get 403 Forbidden

### Test Case 6: Firebase User Disabling
1. Delete entity with Firebase user
2. Verify: Firebase user is disabled
3. Verify: User cannot login
4. Verify: User profile is not deleted from Firebase

## Performance Considerations

### Query Optimization
- Queries use indexed fields: `college_id`, `department_id`, `batch_id`, `student_id`
- Cascade deletes may take time with large hierarchies
- Consider showing progress for large deletions

### Limits
- Firestore transaction limit: 500 operations
- For large deletals, operations are not in a transaction
- No rollback capability if partial failure

### Recommendations
- Add progress indicator for large cascade deletes
- Show warning for deletions affecting >1000 entities
- Consider implementing soft delete option for auditing
- Regular backups recommended

## Security Considerations

1. **Authorization Checks**
   - Strict RBAC enforced before cascade
   - Cannot delete entities outside scope
   - Cannot delete parent entities of other users' entities

2. **Audit Trail**
   - All deletions logged with user_id and timestamp
   - Deleted counts recorded for compliance

3. **Data Protection**
   - Hard delete is permanent
   - No soft delete option for cascade
   - Firebase users disabled but not removed

## Future Enhancements

1. **Soft Delete Option**
   - Keep deleted records for auditing
   - Add recovery option within time window

2. **Bulk Operations Optimization**
   - Batch Firestore operations for performance
   - Parallel deletes where possible

3. **Deletion Preview**
   - Show exact list of entities to be deleted
   - Display before confirmation

4. **Partial Deletion Recovery**
   - If deletion fails mid-cascade
   - Option to retry or rollback

5. **Deletion Requests**
   - Users request deletion
   - Admins approve before cascade
   - Audit trail of requests and approvals
