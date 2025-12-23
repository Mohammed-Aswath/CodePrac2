# Role-Based Question Management - Testing Checklist

## Quick Start Testing

### 1. Backend API Validation

#### Admin Endpoints (Super Admin)
```bash
# Create question as admin
POST /api/admin/questions
{
  "college_id": "college_1",
  "department_id": "dept_1",
  "batch_id": "batch_1",
  "title": "Array Problem",
  "description": "Given an array, find duplicates...",
  "sample_input": "[1,2,2,3]",
  "sample_output": "[2]",
  "language": "python",
  "difficulty": "Medium"
}

# List all questions
GET /api/admin/questions

# Update question
PUT /api/admin/questions/<question_id>
{
  "title": "Updated Title",
  "description": "Updated description..."
}

# Delete question
DELETE /api/admin/questions/<question_id>
```

#### College Endpoints (College Admin)
```bash
# Create question (auto-scoped to college)
POST /api/college/questions
{
  "department_id": "dept_1",      # Required
  "batch_id": "batch_1",           # Required
  "title": "String Problem",
  "description": "Find substring...",
  "sample_input": "hello world",
  "sample_output": "world",
  "language": "javascript"
}

# List college questions
GET /api/college/questions

# Cannot access other college's questions
DELETE /api/college/questions/<other_college_question_id>
# Returns: 403 Forbidden
```

#### Department Endpoints (Department Admin)
```bash
# Create question (auto-scoped to department)
POST /api/department/questions
{
  "batch_id": "batch_1",           # Required
  "topic_id": "topic_1",           # Optional
  "title": "Graph Problem",
  "description": "BFS traversal...",
  "sample_input": "1->2->3",
  "sample_output": "1 2 3",
  "language": "java"
}

# List department questions
GET /api/department/questions

# Cannot access other department's questions
PUT /api/department/questions/<other_dept_question_id>
# Returns: 403 Forbidden
```

#### Batch Endpoints (Batch Admin)
```bash
# Create question (batch auto-filled from JWT)
POST /api/batch/questions
{
  "topic_id": "topic_1",           # Optional
  "title": "Tree Problem",
  "description": "Binary tree traversal...",
  "sample_input": "{1,2,3}",
  "sample_output": "1 2 3",
  "language": "cpp"
}

# List batch questions
GET /api/batch/questions

# Cannot access other batch's questions
DELETE /api/batch/questions/<other_batch_question_id>
# Returns: 403 Forbidden
```

### 2. Frontend UI Testing

#### Super Admin Flow
- [ ] Login as admin user
- [ ] Navigate to Questions tab
- [ ] Click "Add Question"
- [ ] Verify College dropdown is visible
- [ ] Select a college
- [ ] Verify Department dropdown populates
- [ ] Select a department
- [ ] Verify Batch dropdown populates
- [ ] Select a batch
- [ ] Verify Topic dropdown is available (optional)
- [ ] Fill all question fields
- [ ] Click "Create Question"
- [ ] Verify question appears in list

#### College Admin Flow
- [ ] Login as college user
- [ ] Navigate to Questions tab
- [ ] Click "Add Question"
- [ ] Verify NO College dropdown (hidden)
- [ ] Verify Department dropdown is visible
- [ ] Select a department
- [ ] Verify Batch dropdown populates
- [ ] Select a batch
- [ ] Verify Topic dropdown is available (optional)
- [ ] Fill all question fields
- [ ] Click "Create Question"
- [ ] Verify question appears in list
- [ ] Verify cannot see other colleges' questions

#### Department Admin Flow
- [ ] Login as department user
- [ ] Navigate to Questions tab
- [ ] Click "Add Question"
- [ ] Verify NO College or Department dropdowns (hidden)
- [ ] Verify Batch dropdown is visible
- [ ] Select a batch
- [ ] Verify Topic dropdown is available (optional)
- [ ] Fill all question fields
- [ ] Click "Create Question"
- [ ] Verify question appears in list
- [ ] Verify cannot see other departments' questions

#### Batch Admin Flow
- [ ] Login as batch user
- [ ] Navigate to Questions tab
- [ ] Click "Add Question"
- [ ] Verify NO hierarchy dropdowns (all hidden/auto-filled)
- [ ] Verify Topic dropdown is available (optional)
- [ ] Fill all question fields
- [ ] Click "Create Question"
- [ ] Verify question appears in list
- [ ] Verify can only see own batch questions

### 3. Validation Testing

#### Field Validation
- [ ] Submit with empty title → "Title must be at least 3 characters"
- [ ] Submit with title "ab" → "Title must be at least 3 characters"
- [ ] Submit with empty description → "Description must be at least 10 characters"
- [ ] Submit with short description → "Description must be at least 10 characters"
- [ ] Submit with empty sample_input → "Missing required field: sample_input"
- [ ] Submit with empty sample_output → "Missing required field: sample_output"
- [ ] Submit without selecting language → "Missing required field: language"

#### Hierarchy Validation
- [ ] Admin: Submit without college → "Please select College, Department, and Batch"
- [ ] Admin: Submit with college only → "Please select College, Department, and Batch"
- [ ] College: Submit without department → "Please select Department and Batch"
- [ ] Department: Submit without batch → "Please select Batch"

#### Ownership Validation
- [ ] College admin try to select batch from other college → "Batch not found in this college"
- [ ] Department admin try to select topic from other department → "Topic not found in your department"
- [ ] Batch admin try to edit question from other batch → 403 Forbidden

### 4. Edit & Delete Testing

#### Edit Question
- [ ] Admin: Edit any question
- [ ] College: Edit only own college questions
- [ ] Department: Edit only own department questions
- [ ] Batch: Edit only own batch questions
- [ ] Verify edit updates in list immediately
- [ ] Verify cannot edit if not authorized

#### Delete Question
- [ ] Admin: Delete any question
- [ ] College: Delete only own college questions
- [ ] Department: Delete only own department questions
- [ ] Batch: Delete only own batch questions
- [ ] Verify delete confirmation dialog appears
- [ ] Verify question removed from list after delete
- [ ] Verify cannot delete if not authorized

### 5. Error Handling Testing

#### Bad Requests
- [ ] Missing required fields → 400 Bad Request
- [ ] Invalid college_id → 404 Not Found
- [ ] Invalid department_id → 404 Not Found
- [ ] Invalid batch_id → 404 Not Found
- [ ] Verify error message is descriptive

#### Forbidden Access
- [ ] College admin access other college questions → 403 Forbidden
- [ ] Department admin access other department questions → 403 Forbidden
- [ ] Batch admin access other batch questions → 403 Forbidden
- [ ] Verify error message explains permission denied

#### Not Found
- [ ] GET non-existent question → 404 Not Found
- [ ] UPDATE non-existent question → 404 Not Found
- [ ] DELETE non-existent question → 404 Not Found

### 6. Data Integrity Testing

#### Batch Scope Enforcement
- [ ] Admin creates question with college/dept/batch → batch_id saved
- [ ] College creates question with dept/batch → college_id auto-filled
- [ ] Department creates question with batch → dept_id auto-filled
- [ ] Batch creates question → batch_id auto-filled from JWT
- [ ] Verify no question exists without batch_id

#### Audit Logging
- [ ] Check Firestore audit_logs collection
- [ ] Verify create_question logged with user_id
- [ ] Verify update_question logged
- [ ] Verify delete_question logged
- [ ] Verify timestamp recorded

### 7. Performance Testing

#### List Operations
- [ ] Load 100 questions → Response < 1 second
- [ ] Filter by batch → Correct questions returned
- [ ] Filter by topic → Correct questions returned
- [ ] Combined filter → Correct results

#### Create Operations
- [ ] Create question → AI test case generation < 5 seconds
- [ ] Verify hidden_testcases created
- [ ] Verify open_testcases created

### 8. API Response Testing

#### Success Response Format
```json
{
  "error": false,
  "message": "Question created successfully",
  "data": {
    "question_id": "q_123",
    "hidden_testcases_count": 5,
    "title": "Array Problem"
  }
}
```

#### Error Response Format
```json
{
  "error": true,
  "code": "INVALID_INPUT",
  "message": "Title must be at least 3 characters"
}
```

### 9. Cross-Role Testing

#### Verify Isolation
- [ ] Admin sees all questions
- [ ] College admin sees only college questions
- [ ] Department admin sees only department questions
- [ ] Batch admin sees only batch questions
- [ ] Different college admins cannot see each other's questions

#### Verify Hierarchy
- [ ] Questions always have: college_id, department_id, batch_id, topic_id (optional)
- [ ] Admin can manage all hierarchy levels
- [ ] College cannot manage college level
- [ ] Department cannot manage college/department levels
- [ ] Batch cannot manage college/department/batch levels

### 10. Browser Compatibility

- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Edge latest
- [ ] Safari latest
- [ ] Mobile browsers

## Test Data Setup

Create test accounts for each role:

```
Admin:
- Email: admin@codeprac.com
- Password: Admin@123
- Role: admin

College Admin:
- Email: college@codeprac.com
- Password: College@123
- Role: college
- College: College_1

Department Admin:
- Email: dept@codeprac.com
- Password: Dept@123
- Role: department
- College: College_1
- Department: Dept_1

Batch Admin:
- Email: batch@codeprac.com
- Password: Batch@123
- Role: batch
- College: College_1
- Department: Dept_1
- Batch: Batch_2024
```

## Expected Outcomes

✅ All roles can create questions within their authorized scope
✅ Questions are always batch-scoped
✅ Hierarchical access control is strictly enforced
✅ UI dynamically renders based on role
✅ Clear error messages for all validation failures
✅ No orphaned questions (all have batch_id)
✅ Audit trail complete for all operations
✅ Performance meets expectations

## Checklist Completion

- [ ] All backend endpoints tested and working
- [ ] All frontend flows tested and working
- [ ] Validation tested at UI and API levels
- [ ] Error handling tested
- [ ] Data integrity verified
- [ ] Audit logging verified
- [ ] Cross-role isolation verified
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Ready for production
