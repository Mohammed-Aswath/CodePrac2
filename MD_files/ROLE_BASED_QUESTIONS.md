# Role-Based Question Management System - Implementation Guide

## Overview
A complete role-aware question management system has been implemented with strict hierarchical access control and mandatory selection flows.

## Architecture

### Role Hierarchy
```
Super Admin (admin)
├── Can create questions for any college
├── Selects: College → Department → Batch → Question

College Admin (college)
├── Can create questions within their college only
├── Selects: Department → Batch → Question

Department Admin (department)
├── Can create questions within their department only
├── Selects: Batch → Question

Batch Admin (batch)
├── Can only create questions for their batch
├── Questions are always batch-scoped
├── Batch ID is automatically included from JWT
```

## Backend Implementation

### Question Service Module (`question_service.py`)

A centralized service that handles all question operations with role-based access control:

```python
from question_service import QuestionService

# Create questions by role
QuestionService.create_question_by_admin(request_user, data)
QuestionService.create_question_by_college(request_user, data)
QuestionService.create_question_by_department(request_user, data)
QuestionService.create_question_by_batch(request_user, data)

# General operations
QuestionService.get_questions_by_role(request_user)
QuestionService.update_question(request_user, question_id, data)
QuestionService.delete_question(request_user, question_id)
```

### Key Features

1. **Validation**
   - Question field validation (min lengths, required fields)
   - Hierarchical ownership verification
   - Batch scope enforcement
   - Topic belonging verification

2. **Access Control**
   - Role-based endpoint authorization
   - Ownership checks at each level
   - Automatic scope filtering

3. **Error Handling**
   - Clear, descriptive error messages
   - Proper HTTP status codes
   - Detailed audit logging

### API Endpoints

#### Super Admin Endpoints
- `POST /api/admin/questions` - Create question (specify college/dept/batch)
- `GET /api/admin/questions` - List all questions
- `GET /api/admin/questions/<id>` - Get question details
- `PUT /api/admin/questions/<id>` - Update question
- `DELETE /api/admin/questions/<id>` - Delete question

#### College Admin Endpoints
- `POST /api/college/questions` - Create question (specify dept/batch)
- `GET /api/college/questions` - List questions in college
- `GET /api/college/questions/<id>` - Get question details
- `PUT /api/college/questions/<id>` - Update question
- `DELETE /api/college/questions/<id>` - Delete question

#### Department Admin Endpoints
- `POST /api/department/questions` - Create question (specify batch)
- `GET /api/department/questions` - List questions in department
- `GET /api/department/questions/<id>` - Get question details
- `PUT /api/department/questions/<id>` - Update question
- `DELETE /api/department/questions/<id>` - Delete question

#### Batch Admin Endpoints
- `POST /api/batch/questions` - Create question (batch auto-filled)
- `GET /api/batch/questions` - List questions in batch
- `GET /api/batch/questions/<id>` - Get question details
- `PUT /api/batch/questions/<id>` - Update question
- `DELETE /api/batch/questions/<id>` - Delete question

## Frontend Implementation

### Role-Based Question Module (`js/questions-rbac.js`)

Handles all client-side question operations with dynamic UI rendering:

```javascript
// Initialize based on user role
Questions.init()

// Load questions (role-aware filtering)
Questions.loadQuestions()

// Open create modal (shows appropriate hierarchy selects)
Questions.openModal()

// Save question (validates hierarchy before submission)
Questions.save()

// Edit/Delete with ownership checks
Questions.edit(questionId)
Questions.delete(questionId)
```

### Dynamic UI Flow

#### For Super Admin
```
Modal Opens
├─ Select College (triggers: loadDepartments)
├─ Select Department (triggers: loadBatches)
├─ Select Batch (fixed)
├─ [Optional] Select Topic
└─ Fill Question Details
```

#### For College Admin
```
Modal Opens
├─ Select Department (triggers: loadBatches)
├─ Select Batch (fixed)
├─ [Optional] Select Topic
└─ Fill Question Details
```

#### For Department Admin
```
Modal Opens
├─ Select Batch (fixed)
├─ [Optional] Select Topic
└─ Fill Question Details
```

#### For Batch Admin
```
Modal Opens
├─ Batch ID auto-filled from JWT
├─ [Optional] Select Topic
└─ Fill Question Details
```

### Question Fields

All questions require:
- **Title** (minimum 3 characters)
- **Description** (minimum 10 characters)
- **Sample Input** (example input data)
- **Sample Output** (expected output)
- **Language** (Python, Java, C++, JavaScript, C)
- **Difficulty** (Easy, Medium, Hard)

Optional:
- **Topic** (linked to department)

### Modal Structure (Updated HTML)

```html
<div id="questionModal">
  <!-- Hierarchy Selects (visible based on role) -->
  <select id="questionCollege">...</select>       <!-- Admin only -->
  <select id="questionDepartment">...</select>    <!-- Admin, College -->
  <select id="questionBatch">...</select>         <!-- Admin, College, Department -->
  <select id="questionTopic">...</select>         <!-- All (Optional) -->
  
  <!-- Question Details -->
  <input id="questionTitle" type="text">
  <textarea id="questionDescription"></textarea>
  <textarea id="questionSampleInput"></textarea>
  <textarea id="questionSampleOutput"></textarea>
  <select id="questionLanguage"></select>
  <select id="questionDifficulty"></select>
</div>
```

## Validation Flow

### Client-Side Validation
1. Check all required fields are filled
2. Validate field lengths (title ≥ 3, description ≥ 10)
3. Verify hierarchy selects based on role
4. Ensure batch is always selected

### Server-Side Validation
1. Validate question data structure
2. Verify role-based permissions
3. Check hierarchical ownership
4. Ensure batch scope enforcement
5. Log all operations for audit trail

## Data Flow Diagram

```
User Login (JWT includes college_id, department_id, batch_id)
    ↓
Open Question Modal
    ↓
showModalForRole() → Render appropriate selects
    ↓
User fills form (hierarchy + question details)
    ↓
Questions.save()
    ↓
Build payload with role-specific fields
    ↓
POST to role-appropriate endpoint (/admin/questions, /college/questions, etc.)
    ↓
Backend QuestionService validates
    ↓
Check role permissions
    ↓
Verify hierarchical ownership
    ↓
Generate AI test cases
    ↓
Save to Firestore
    ↓
Return success with question_id
    ↓
Reload questions table
```

## Testing Guide

### Test Super Admin
1. Login as admin user
2. Click "Add Question"
3. Should see College → Department → Batch dropdowns
4. Select college, triggers department load
5. Select department, triggers batch load
6. Select batch
7. Fill question details
8. Submit
9. Verify question appears in list with correct college/dept/batch

### Test College Admin
1. Login as college user
2. Click "Add Question"
3. Should see Department → Batch dropdowns (not College)
4. Select department, triggers batch load
5. Select batch
6. Fill question details
7. Submit
8. Verify only questions in college are listed

### Test Department Admin
1. Login as department user
2. Click "Add Question"
3. Should see Batch dropdown (not Department/College)
4. Batch auto-filtered for this department
5. [Optional] Select topic
6. Fill question details
7. Submit
8. Verify only questions in department are listed

### Test Batch Admin
1. Login as batch user
2. Click "Add Question"
3. Should NOT see Batch dropdown (auto-filled from JWT)
4. [Optional] Select topic
5. Fill question details
6. Submit
7. Verify only questions in batch are listed

## Error Scenarios

### Invalid Access
```
Role: Department Admin
Action: Try to create question with batch from different department
Result: "Batch not found in your department" (403 Forbidden)
```

### Missing Hierarchy
```
Role: Admin
Action: Submit without selecting college
Result: "Please select College, Department, and Batch" (400 Bad Request)
```

### Invalid Topic
```
Action: Select topic from different department
Result: "Topic not found in this department" (404 Not Found)
```

### Missing Fields
```
Action: Submit with empty title
Result: "Title must be at least 3 characters" (400 Bad Request)
```

## Database Schema

### Questions Collection
```json
{
  "id": "question_123",
  "college_id": "college_abc",
  "department_id": "dept_xyz",
  "batch_id": "batch_001",
  "topic_id": "topic_456",
  "title": "Two Sum Problem",
  "description": "Given an array of integers, find two numbers that add up to target",
  "sample_input": "arr = [2, 7, 11, 15], target = 9",
  "sample_output": "[0, 1]",
  "language": "python",
  "difficulty": "Easy",
  "open_testcases": [...],
  "hidden_testcases": [...],
  "is_active": true,
  "created_at": "2025-12-21T10:30:00Z",
  "updated_at": "2025-12-21T10:30:00Z"
}
```

## File Structure

### Backend Files
- `question_service.py` - Central service with role-based CRUD
- `routes/admin.py` - Super admin question endpoints (updated)
- `routes/college.py` - College admin question endpoints (new)
- `routes/department.py` - Department admin question endpoints (updated)
- `routes/batch.py` - Batch admin question endpoints (updated)

### Frontend Files
- `js/questions-rbac.js` - Role-based question management module (new)
- `index.html` - Updated question modal with hierarchical selects

## Security Features

1. **JWT-Based Authorization**
   - Role verified on every endpoint
   - Ownership verified before operations
   - College/Department/Batch ID included in JWT

2. **Hierarchical Scope Enforcement**
   - Super admin can see all, but must explicitly select scope
   - College admin cannot access other colleges
   - Department admin cannot access other departments
   - Batch admin cannot access other batches

3. **Batch Scope Enforcement**
   - Every question must belong to exactly one batch
   - Queries automatically filtered by batch
   - Bulk operations update batch_id automatically

4. **Audit Logging**
   - All create/update/delete logged with user_id and timestamp
   - Timestamp and user tracked in Firestore

## Troubleshooting

### Questions not appearing after creation
- Check browser console for errors
- Verify JWT token includes correct role
- Ensure batch_id is in user profile
- Check Firestore for question document

### Dropdowns not loading
- Verify API endpoint URLs match role
- Check for CORS errors in network tab
- Verify college/dept/batch IDs are valid
- Check Firebase permissions

### Permission denied errors
- Verify JWT token is valid and not expired
- Check user role in Firebase
- Verify college_id/department_id/batch_id match ownership
- Review error message for specific denied resource

## Next Steps

1. **Frontend Enhancement**
   - Add bulk question import from CSV
   - Add question versioning
   - Add question templates

2. **Backend Enhancement**
   - Add question difficulty analytics
   - Add attempt statistics
   - Add question performance tracking

3. **Security**
   - Add rate limiting to question creation
   - Add question content moderation
   - Add DLP for sensitive test cases

