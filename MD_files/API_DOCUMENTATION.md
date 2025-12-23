# CODEPRAC 2.0 API DOCUMENTATION

## Base URL

```
Development: http://localhost:5000
Production: https://codeprac-backend.onrender.com
```

## Authentication

All endpoints (except health check and login) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

## Response Format

### Success Response

```json
{
  "error": false,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "error": true,
  "code": "ERROR_CODE",
  "message": "Error message",
  "details": {}
}
```

## Endpoints

---

## AUTH ENDPOINTS

### POST /api/auth/login

Login with Firebase token and receive JWT.

**Request:**

```json
{
  "firebase_token": "firebase-id-token"
}
```

**Response (201):**

```json
{
  "error": false,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "role": "student|college|department|admin",
    "user": {
      "id": "user-id",
      "username": "username",
      "email": "email@example.com"
    }
  }
}
```

**Error Codes:**

- `INVALID_INPUT`: Missing email or password
- `INVALID_TOKEN`: Invalid Firebase token
- `NOT_FOUND`: User not found in system
- `ACCESS_DENIED`: User is disabled

---

### POST /api/auth/password-reset-request

Request a password reset email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "error": false,
  "message": "Password reset email sent"
}
```

---

### POST /api/auth/verify-token

Verify JWT token validity.

**Request:**

```json
{
  "token": "jwt-token"
}
```

**Response (200):**

```json
{
  "error": false,
  "message": "Token is valid",
  "data": {
    "payload": {
      "firebase_uid": "...",
      "role": "admin",
      ...
    }
  }
}
```

**Error Codes:**

- `INVALID_TOKEN`: Token is invalid or expired

---

## ADMIN ENDPOINTS (`/api/admin/`)

All admin endpoints require `role: "admin"` in JWT token.

### POST /api/admin/colleges

Create a new college.

**Request:**

```json
{
  "name": "College Name",
  "email": "college@example.com"
}
```

**Response (201):**

```json
{
  "error": false,
  "message": "College created",
  "data": {
    "college_id": "college-uuid"
  }
}
```

**Error Codes:**

- `INVALID_INPUT`: Missing required fields
- `INVALID_EMAIL`: Invalid email format

---

### GET /api/admin/colleges

List all colleges.

**Query Parameters:** None

**Response (200):**

```json
{
  "error": false,
  "message": "Success",
  "data": {
    "colleges": [
      {
        "id": "college-id",
        "name": "College Name",
        "email": "college@example.com",
        "is_disabled": false,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### GET /api/admin/colleges/{collegeId}

Get college details.

**Response (200):** College object

**Error Codes:**

- `NOT_FOUND`: College does not exist

---

### PUT /api/admin/colleges/{collegeId}

Update college.

**Request:**

```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

**Response (200):** Success message

---

### POST /api/admin/colleges/{collegeId}/disable

Disable a college (soft delete).

**Response (200):** Success message

**Effect:** All departments and students under this college are blocked from accessing platform.

---

### POST /api/admin/colleges/{collegeId}/enable

Enable a disabled college.

**Response (200):** Success message

---

### POST /api/admin/departments

Create a department under a college.

**Request:**

```json
{
  "college_id": "college-uuid",
  "name": "Department Name",
  "email": "dept@example.com"
}
```

**Response (201):** Department created with ID

**Error Codes:**

- `NOT_FOUND`: College does not exist
- `INVALID_EMAIL`: Invalid email format

---

### GET /api/admin/departments

List all departments.

**Query Parameters:**

- `college_id` (optional): Filter by college

**Response (200):** Array of departments

---

### GET /api/admin/departments/{deptId}

Get department details.

**Response (200):** Department object

---

### PUT /api/admin/departments/{deptId}

Update department.

**Request:**

```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

**Response (200):** Success message

---

### POST /api/admin/departments/{deptId}/disable

Disable a department.

**Response (200):** Success message

---

### POST /api/admin/departments/{deptId}/enable

Enable a disabled department.

**Response (200):** Success message

---

### POST /api/admin/batches

Create a batch.

**Request:**

```json
{
  "department_id": "dept-uuid",
  "college_id": "college-uuid",
  "batch_name": "2023-2027"
}
```

**Response (201):** Batch created

**Error Codes:**

- `INVALID_FORMAT`: Batch name must be YYYY-YYYY format

---

### GET /api/admin/batches

List all batches.

**Query Parameters:**

- `department_id` (optional): Filter by department

**Response (200):** Array of batches

---

### GET /api/admin/batches/{batchId}

Get batch details.

**Response (200):** Batch object

---

### POST /api/admin/batches/{batchId}/disable

Disable a batch.

**Response (200):** Success message

---

### POST /api/admin/batches/{batchId}/enable

Enable a batch.

**Response (200):** Success message

---

### POST /api/admin/students

Create a student.

**Request:**

```json
{
  "batch_id": "batch-uuid",
  "username": "student_username",
  "email": "student@example.com"
}
```

**Response (201):**

```json
{
  "error": false,
  "message": "Student created",
  "data": {
    "student_id": "student-uuid",
    "password": "password"
  }
}
```

**Error Codes:**

- `CONFLICT`: Username or email already exists
- `INVALID_USERNAME`: Username invalid (alphanumeric, 3-20 chars)

---

### GET /api/admin/students

List students.

**Query Parameters:**

- `batch_id` (optional): Filter by batch

**Response (200):** Array of students

---

### GET /api/admin/students/{studentId}

Get student details.

**Response (200):** Student object

---

### POST /api/admin/students/{studentId}/disable

Disable a student.

**Response (200):** Success message

---

### POST /api/admin/students/{studentId}/enable

Enable a student.

**Response (200):** Success message

---

### GET /api/admin/performance

Get performance data.

**Query Parameters:**

- `college_id` (optional): Filter by college
- `department_id` (optional): Filter by department
- `batch_id` (optional): Filter by batch
- `student_id` (optional): Filter by student

**Response (200):** Array of performance records

---

### GET /api/admin/performance/summary

Get aggregated performance summary.

**Response (200):** Aggregated performance data

---

## COLLEGE ENDPOINTS (`/api/college/`)

All college endpoints require `role: "college"` in JWT token.

### GET /api/college/departments

List departments under this college.

**Response (200):** Array of departments

---

### POST /api/college/departments

Create a department under this college.

**Request:**

```json
{
  "name": "Department Name",
  "email": "dept@example.com"
}
```

**Response (201):** Department created

---

### GET /api/college/performance

View performance data for college.

**Query Parameters:**

- `department_id` (optional): Filter by department
- `batch_id` (optional): Filter by batch

**Response (200):** Array of performance records

---

## DEPARTMENT ENDPOINTS (`/api/department/`)

All department endpoints require `role: "department"` in JWT token.

### POST /api/department/batches

Create a batch.

**Request:**

```json
{
  "batch_name": "2023-2027"
}
```

**Response (201):** Batch created

---

### GET /api/department/batches

List batches under this department.

**Response (200):** Array of batches

---

### POST /api/department/students/upload

Upload students via CSV.

**Request:**

- Form data with file upload
- CSV format: `username,email,password`
- Form field: `batch_id`

**Response (200):**

```json
{
  "error": false,
  "message": "Created X students",
  "data": {
    "created": [
      {
        "student_id": "id",
        "email": "email@example.com"
      }
    ],
    "errors": ["Error message 1", "Error message 2"]
  }
}
```

---

### GET /api/department/students

List students under this department.

**Query Parameters:**

- `batch_id` (optional): Filter by batch

**Response (200):** Array of students

---

### POST /api/department/topics

Create a topic.

**Request:**

```json
{
  "name": "Arrays"
}
```

**Response (201):** Topic created

---

### GET /api/department/topics

List topics under this department.

**Response (200):** Array of topics

---

### POST /api/department/questions

Create a question (with AI-generated test cases).

**Request:**

```json
{
  "topic_id": "topic-uuid",
  "batch_id": "batch-uuid",
  "title": "Two Sum",
  "description": "Given an array of integers...",
  "language": "python",
  "sample_input": "nums = [2,7,11,15]\ntarget = 9",
  "sample_output": "[0,1]"
}
```

**Response (201):**

```json
{
  "error": false,
  "message": "Question created",
  "data": {
    "question_id": "question-uuid",
    "hidden_testcases_count": 5
  }
}
```

---

### GET /api/department/questions

List questions.

**Query Parameters:**

- `batch_id` (optional): Filter by batch
- `topic_id` (optional): Filter by topic

**Response (200):** Array of questions

---

### GET /api/department/questions/{questionId}

Get question details.

**Response (200):** Question object (including hidden test cases)

---

### PUT /api/department/questions/{questionId}

Update question.

**Request:**

```json
{
  "title": "New Title",
  "description": "New description",
  "sample_input": "...",
  "sample_output": "..."
}
```

**Response (200):** Success message

---

### DELETE /api/department/questions/{questionId}

Delete question.

**Response (200):** Success message

---

### POST /api/department/notes

Create a note.

**Request:**

```json
{
  "topic_id": "topic-uuid",
  "title": "Arrays Basics",
  "google_drive_link": "https://drive.google.com/file/..."
}
```

**Response (201):** Note created

---

### GET /api/department/notes

List notes.

**Query Parameters:**

- `topic_id` (optional): Filter by topic

**Response (200):** Array of notes

---

### DELETE /api/department/notes/{noteId}

Delete note.

**Response (200):** Success message

---

## STUDENT ENDPOINTS (`/api/student/`)

All student endpoints require `role: "student"` in JWT token.

Student cannot access platform if they or any ancestor (batch, department, college) is disabled.

### GET /api/student/topics

List available topics.

**Response (200):** Array of topics

---

### GET /api/student/questions

List questions for student's batch.

**Query Parameters:**

- `topic_id` (optional): Filter by topic

**Response (200):** Array of questions (without hidden test cases)

---

### GET /api/student/questions/{questionId}

Get question details.

**Response (200):** Question object (without hidden test cases)

---

### POST /api/student/submit

Submit code for evaluation.

**Request:**

```json
{
  "question_id": "question-uuid",
  "code": "def solve(nums, target):\n    # solution",
  "language": "python"
}
```

**Response (200):**

```json
{
  "error": false,
  "message": "Submission successful",
  "data": {
    "status": "correct|incorrect|compilation_error",
    "test_results": {
      "total": 5,
      "passed": 5,
      "failed": 0
    },
    "efficiency_feedback": {
      "feedback": "Your solution can be optimized...",
      "suggestions": ["Use set for O(1) lookup"]
    },
    "performance_id": "perf-uuid"
  }
}
```

**Workflow:**

1. Code is compiled with sample input
2. If compilation successful, evaluated against all test cases (open + hidden)
3. If all tests pass, efficiency feedback is generated
4. Performance record is created in database

---

### GET /api/student/notes

List notes for student's department.

**Query Parameters:**

- `topic_id` (optional): Filter by topic

**Response (200):** Array of notes

---

### GET /api/student/performance

Get submission history.

**Query Parameters:**

- `question_id` (optional): Filter by question

**Response (200):** Array of performance records (sorted by submission time, descending)

---

## Error Codes Reference

| Code               | HTTP Status | Description                                           |
| ------------------ | ----------- | ----------------------------------------------------- |
| `INVALID_INPUT`    | 400         | Missing or invalid required fields                    |
| `INVALID_EMAIL`    | 400         | Email format is invalid                               |
| `INVALID_USERNAME` | 400         | Username format is invalid (3-20 chars, alphanumeric) |
| `INVALID_FORMAT`   | 400         | Format validation failed (e.g., batch name)           |
| `INVALID_TOKEN`    | 401         | JWT token is invalid or expired                       |
| `NO_AUTH`          | 401         | Missing authorization header                          |
| `CONFLICT`         | 409         | Resource already exists (duplicate username/email)    |
| `NOT_FOUND`        | 404         | Resource does not exist                               |
| `FORBIDDEN`        | 403         | User lacks permissions for this action                |
| `ACCESS_DENIED`    | 403         | User or parent entity is disabled                     |
| `AUTH_ERROR`       | 500         | Firebase authentication error                         |
| `EMAIL_ERROR`      | 500         | Email service error                                   |
| `INTERNAL_ERROR`   | 500         | Server-side error                                     |

---

## Rate Limiting

Current limits (per authenticated user):

- Code submissions: 100 per hour
- CSV uploads: 1 per minute
- General API calls: 1000 per hour

---

## Pagination

Some endpoints support pagination (future enhancement):

- `?limit=20&offset=0`

---

## Examples

### Example 1: Complete Student Workflow

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"firebase_token": "firebase-token"}'

# Response: {"error": false, "data": {"token": "jwt-token", ...}}

# 2. Get topics
curl http://localhost:5000/api/student/topics \
  -H "Authorization: Bearer jwt-token"

# 3. Get questions
curl 'http://localhost:5000/api/student/questions?topic_id=topic-uuid' \
  -H "Authorization: Bearer jwt-token"

# 4. Submit code
curl -X POST http://localhost:5000/api/student/submit \
  -H "Authorization: Bearer jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "q-uuid",
    "code": "def solve():\n    return 42",
    "language": "python"
  }'

# 5. View performance history
curl http://localhost:5000/api/student/performance \
  -H "Authorization: Bearer jwt-token"
```

### Example 2: Department Creates Question

```bash
# 1. Create topic
curl -X POST http://localhost:5000/api/department/topics \
  -H "Authorization: Bearer dept-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Arrays"}'

# Response: {"error": false, "data": {"topic_id": "topic-uuid"}}

# 2. Create question (AI generates hidden test cases)
curl -X POST http://localhost:5000/api/department/questions \
  -H "Authorization: Bearer dept-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "topic-uuid",
    "batch_id": "batch-uuid",
    "title": "Two Sum",
    "description": "Given an array of integers nums and an integer target...",
    "language": "python",
    "sample_input": "nums = [2,7,11,15], target = 9",
    "sample_output": "[0,1]"
  }'

# Response: {"error": false, "data": {"question_id": "q-uuid", "hidden_testcases_count": 5}}
```

---

## Support

For API issues:

1. Check status code and error code
2. Review request format against documentation
3. Verify authentication token is valid
4. Check environment variables configuration
