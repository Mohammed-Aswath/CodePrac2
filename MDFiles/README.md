# CODEPRAC 2.0 Backend Implementation

## Overview

This is the Flask backend for CODEPRAC 2.0, a competitive programming practice platform with AI-powered code evaluation.

## Project Structure

```
.
├── app.py                     # Main Flask application
├── config.py                  # Configuration management
├── auth.py                    # JWT and Firebase authentication
├── models.py                  # Firestore models and database helpers
├── firebase_init.py           # Firebase initialization
├── agent_wrappers.py          # Wrappers for AI agent integration
├── utils.py                   # Utility functions and validators
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variables template
├── routes/
│   ├── __init__.py
│   ├── auth.py               # Authentication endpoints
│   ├── admin.py              # Admin tier API endpoints
│   ├── college.py            # College tier API endpoints
│   ├── department.py         # Department tier API endpoints
│   └── student.py            # Student tier API endpoints
└── agents/                    # AI agents (imported from parent)
    ├── compiler_agent.py      # Code compilation
    ├── evaluator_agent.py     # Solution evaluation
    ├── efficiency_agent.py    # Efficiency analysis
    ├── testcase_agent.py      # Test case generation
    └── groq_client.py         # Groq API client
```

## Setup Instructions

### 1. Prerequisites

- Python 3.8+
- Firebase project with Firestore database
- Groq API key (for AI agents)

### 2. Installation

```bash
# Clone the repository
cd d:\PRJJ

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
# Required environment variables:
# - FIREBASE_PROJECT_ID
# - FIREBASE_API_KEY
# - FIREBASE_CREDENTIALS_PATH
# - FIRESTORE_PROJECT_ID
# - GROQ_API_KEY
# - JWT_SECRET
```

### 4. Firebase Setup

```bash
# Download your Firebase service account key from:
# Firebase Console → Project Settings → Service Accounts → Generate New Private Key

# Place the JSON file in the project root as firebase-key.json
# Update FIREBASE_CREDENTIALS_PATH in .env if you use a different name
```

### 5. Run the Application

```bash
# Development mode
python app.py

# The backend will run on http://localhost:5000
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with Firebase token
- `POST /api/auth/password-reset-request` - Request password reset
- `POST /api/auth/verify-token` - Verify JWT token

### Admin Routes (`/api/admin/`)

- **Colleges**: POST, GET, PUT, DELETE (disable), POST (enable)
- **Departments**: POST, GET, PUT, DELETE, ENABLE
- **Batches**: POST, GET, DELETE, ENABLE
- **Students**: POST, GET, DELETE, ENABLE
- **Performance**: GET (with filters), GET (summary)

### College Routes (`/api/college/`)

- `GET /departments` - List departments under college
- `POST /departments` - Create department
- `GET /performance` - View performance data

### Department Routes (`/api/department/`)

- **Batches**: POST, GET
- **Students**: POST (upload CSV), GET
- **Topics**: POST, GET
- **Questions**: POST, GET, PUT, DELETE
- **Notes**: POST, GET, DELETE

### Student Routes (`/api/student/`)

- `GET /topics` - List available topics
- `GET /questions` - List questions for student's batch
- `GET /questions/{id}` - Get question details
- `POST /submit` - Submit code for evaluation
- `GET /notes` - View notes
- `GET /performance` - View submission history

## Firestore Collections

### Colleges

```json
{
  "name": "string",
  "email": "string",
  "is_disabled": "boolean",
  "created_at": "timestamp"
}
```

### Departments

```json
{
  "college_id": "string (reference)",
  "name": "string",
  "email": "string",
  "is_disabled": "boolean",
  "created_at": "timestamp"
}
```

### Batches

```json
{
  "department_id": "string (reference)",
  "college_id": "string (reference)",
  "batch_name": "string (e.g., '2023-2027')",
  "is_disabled": "boolean",
  "created_at": "timestamp"
}
```

### Students

```json
{
  "batch_id": "string (reference)",
  "department_id": "string (reference)",
  "college_id": "string (reference)",
  "username": "string (unique)",
  "email": "string (unique)",
  "firebase_uid": "string",
  "is_disabled": "boolean",
  "password_reset_required": "boolean",
  "created_at": "timestamp"
}
```

### Questions

```json
{
  "topic_id": "string (reference)",
  "department_id": "string (reference)",
  "batch_id": "string (reference)",
  "college_id": "string (reference)",
  "title": "string",
  "description": "string",
  "language": "string",
  "sample_input": "string",
  "sample_output": "string",
  "open_testcases": "array",
  "hidden_testcases": "array",
  "created_at": "timestamp"
}
```

### Performance

```json
{
  "student_id": "string (reference)",
  "question_id": "string (reference)",
  "batch_id": "string (reference)",
  "department_id": "string (reference)",
  "college_id": "string (reference)",
  "status": "string (pending|correct|incorrect|compilation_error)",
  "submission_code": "string",
  "submission_language": "string",
  "test_results": { "total": "number", "passed": "number", "failed": "number" },
  "efficiency_feedback": "string (optional)",
  "submitted_at": "timestamp",
  "attempts": "number"
}
```

## Role-Based Access Control

| Role           | Permissions                                          |
| -------------- | ---------------------------------------------------- |
| **Admin**      | Full CRUD on all entities, view all performance data |
| **College**    | Manage departments, view college's performance data  |
| **Department** | Manage batches, students, questions, notes           |
| **Student**    | Practice questions, submit code, view notes          |

## AI Agent Integration

The backend integrates 4 AI agents for code evaluation:

1. **Compiler Agent** - Compiles and runs code
2. **Evaluator Agent** - Tests code against test cases
3. **Efficiency Agent** - Suggests optimizations after correct submission
4. **Test Case Generator** - Generates hidden test cases for questions

All agents are imported from the `agents/` package and wrapped in `agent_wrappers.py`.

## Error Handling

All API responses follow a standardized format:

### Success Response

```json
{
  "error": false,
  "message": "Success message",
  "data": {}
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

## Security Features

- JWT-based authentication with 24-hour expiration
- Firebase email-based password reset
- Role-based access control middleware
- Disable ≠ Delete: Disabled entities remain in database but cannot access platform
- Input validation and sanitization
- CORS protection
- Audit logging for admin actions

## Deployment

### On Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set environment variables in Render dashboard
5. Deploy

### Environment Variables Required

```
DEBUG=False
JWT_SECRET=<strong-secret-key>
FIRESTORE_PROJECT_ID=<your-project-id>
FIREBASE_API_KEY=<your-api-key>
FIREBASE_CREDENTIALS_PATH=/etc/secrets/firebase-key.json
GROQ_API_KEY=<your-groq-key>
FRONTEND_URL=<your-frontend-url>
```

## Testing

To test the endpoints, use tools like:

- Postman
- cURL
- Thunder Client (VS Code extension)

Example login request:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_token": "your-firebase-token"
  }'
```

## Troubleshooting

### Firebase Connection Issues

- Verify `FIREBASE_CREDENTIALS_PATH` points to correct JSON file
- Ensure Firebase project is active and Firestore is enabled

### AI Agent Errors

- Check `GROQ_API_KEY` is valid
- Verify agents are in `agents/` folder
- Check Groq API rate limits

### Database Connection Issues

- Verify Firestore indexes are created
- Check firewall rules allow Firestore access
- Ensure `FIRESTORE_PROJECT_ID` matches your project

## Documentation

For detailed architectural planning, see [ARCHITECTURAL_PLAN.md](ARCHITECTURAL_PLAN.md)

## License

This project is part of CODEPRAC 2.0 platform.
