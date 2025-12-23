# CODEPRAC 2.0 - DEPLOYMENT & VALIDATION GUIDE

## Pre-Deployment Checklist

### Code Quality

- [ ] All Python files follow PEP 8 style guide
- [ ] No hardcoded secrets (use environment variables)
- [ ] Imports are organized and minimal
- [ ] All functions have docstrings
- [ ] Error handling is comprehensive
- [ ] Logging is implemented for debugging

### Security

- [ ] JWT secret is strong (min 32 chars)
- [ ] CORS is properly configured (FRONTEND_URL)
- [ ] All user inputs are validated
- [ ] SQL injection prevention (using Firestore, inherently safe)
- [ ] Role-based access control is enforced
- [ ] Sensitive data (passwords) never logged
- [ ] Firebase credentials not in code repository

### Database

- [ ] Firestore collections created
- [ ] Indexes created for composite queries
- [ ] Soft delete logic implemented (is_disabled field)
- [ ] Data consistency rules enforced

### API Endpoints

- [ ] All endpoints require authentication (except /health, /api/auth/login)
- [ ] Role-based access enforced
- [ ] Request validation on all endpoints
- [ ] Response format is consistent
- [ ] Error responses are standardized

### AI Integration

- [ ] All 4 agents are imported correctly
- [ ] Wrappers handle agent failures gracefully
- [ ] Test case generation works
- [ ] Code evaluation returns expected format
- [ ] Efficiency feedback is optional (only for correct submissions)

## Deployment Steps

### 1. Local Testing

```bash
# Create virtual environment
python -m venv venv

# Activate
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with test values

# Run local server
python app.py

# Test endpoints
# Health check:
curl http://localhost:5000/health

# Login (with Firebase token):
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"firebase_token": "test-token"}'
```

### 2. Render Deployment

#### Step 1: Prepare GitHub Repository

```bash
# Create .gitignore (if not exists)
git init
git add .
git commit -m "Initial commit: CODEPRAC 2.0 backend"
git push origin main
```

#### Step 2: Create Render Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: codeprac-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:create_app()`
   - **Region**: Choose closest to users
   - **Plan**: Starter (or upgrade as needed)

#### Step 3: Set Environment Variables

In Render dashboard, go to Service Settings → Environment and add:

```
DEBUG=False
SECRET_KEY=<generate-random-32-char-string>
JWT_SECRET=<generate-random-32-char-string>

FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_API_KEY=<your-firebase-api-key>
FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
FIREBASE_APP_ID=<your-app-id>

FIRESTORE_PROJECT_ID=<your-firestore-project-id>
GROQ_API_KEY=<your-groq-api-key>

FRONTEND_URL=https://<your-frontend-domain>
```

#### Step 4: Upload Firebase Credentials

Since Render doesn't allow arbitrary file uploads, use one of these approaches:

**Option A: Base64 Encode Firebase Key**

```bash
# Encode your firebase-key.json
cat firebase-key.json | base64 > firebase-key.txt

# Add to Render environment:
FIREBASE_KEY_BASE64=<base64-content>

# Modify firebase_init.py to decode:
import base64
import os
if os.getenv('FIREBASE_KEY_BASE64'):
    key_data = base64.b64decode(os.getenv('FIREBASE_KEY_BASE64'))
    creds = credentials.Certificate(key_data)
```

**Option B: Use Firebase Admin SDK (Recommended)**

```python
# Use environment variables instead of file
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.getenv('FIREBASE_CREDENTIALS_PATH')
```

#### Step 5: Deploy

```bash
# Push to GitHub (Render auto-deploys)
git push origin main

# Monitor deployment in Render dashboard
# Check logs for any errors
```

### 3. Frontend Integration

Update frontend API calls to use your Render URL:

```javascript
const API_BASE_URL = "https://codeprac-backend.onrender.com";

// Example login call
const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${firebaseToken}`,
  },
  body: JSON.stringify({ firebase_token: firebaseToken }),
});
```

### 4. Firestore Security Rules

Set these rules in Firebase Console → Firestore Database → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Admin full access
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }

    // Students can read their own data
    match /students/{studentId} {
      allow read: if request.auth.uid == resource.data.firebase_uid;
    }

    // Students can read questions for their batch
    match /questions/{questionId} {
      allow read: if request.auth.token.batch_id == resource.data.batch_id;
    }

    // Departments can manage their data
    match /questions/{questionId} {
      allow read, write: if request.auth.token.department_id == resource.data.department_id;
    }

    match /notes/{noteId} {
      allow read: if request.auth.token.department_id == resource.data.department_id;
    }

    // Performance data scoped by role
    match /performance/{perfId} {
      allow read: if (
        request.auth.token.student_id == resource.data.student_id ||
        request.auth.token.department_id == resource.data.department_id ||
        request.auth.token.college_id == resource.data.college_id ||
        request.auth.token.role == 'admin'
      );
    }
  }
}
```

## Post-Deployment Validation

### 1. Smoke Tests

```bash
# Health check
curl https://codeprac-backend.onrender.com/health

# Login test (need valid Firebase token)
curl -X POST https://codeprac-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"firebase_token": "test-token"}'

# Admin list colleges (with valid JWT)
curl https://codeprac-backend.onrender.com/api/admin/colleges \
  -H "Authorization: Bearer <jwt-token>"
```

### 2. Role-Based Access Validation

- [ ] Admin can access all `/api/admin/` endpoints
- [ ] College user can access `/api/college/` endpoints
- [ ] Department user can access `/api/department/` endpoints
- [ ] Student can access `/api/student/` endpoints
- [ ] Unauthorized users get 403 Forbidden
- [ ] Disabled users cannot access platform

### 3. Core Workflow Tests

#### Student Workflow

- [ ] Student logs in
- [ ] Student views available topics
- [ ] Student selects question
- [ ] Student submits code
- [ ] Compiler agent evaluates code
- [ ] Evaluator agent runs test cases
- [ ] If correct, efficiency agent provides feedback
- [ ] Performance record is stored

#### Department Workflow

- [ ] Department creates batch
- [ ] Department uploads student CSV
- [ ] Student records created in Firestore
- [ ] Firebase Auth users created
- [ ] Department creates question
- [ ] AI generates hidden test cases
- [ ] Department uploads notes

#### Admin Workflow

- [ ] Admin creates college
- [ ] Admin creates department under college
- [ ] Admin disables college (all descendants blocked)
- [ ] Admin enables college
- [ ] Admin views performance summary

### 4. Data Integrity Tests

- [ ] Disable ≠ Delete: Disabled records remain in DB
- [ ] Cascade disable works: Disabling college disables students
- [ ] Role-based visibility: Users only see their data
- [ ] Audit logs created for admin actions

### 5. Error Handling Tests

```bash
# Test 401 Unauthorized
curl https://codeprac-backend.onrender.com/api/admin/colleges
# Should return: 401 Unauthorized

# Test 403 Forbidden (student accessing admin endpoint)
curl https://codeprac-backend.onrender.com/api/admin/colleges \
  -H "Authorization: Bearer <student-jwt>"
# Should return: 403 Forbidden

# Test 404 Not Found
curl https://codeprac-backend.onrender.com/api/admin/colleges/nonexistent
# Should return: 404 Not Found

# Test 400 Bad Request (missing required field)
curl -X POST https://codeprac-backend.onrender.com/api/admin/colleges \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Should return: 400 Bad Request (missing name)
```

### 6. Performance Tests

- [ ] Code submission completes within 30 seconds
- [ ] Large CSV upload (1000 students) completes successfully
- [ ] Query with filters returns within 5 seconds
- [ ] Concurrent submissions don't cause errors

## Monitoring & Debugging

### Enable Debug Logging

Update `.env`:

```
DEBUG=True
LOG_LEVEL=DEBUG
```

### Check Render Logs

In Render dashboard:

1. Select your service
2. Go to "Logs"
3. Monitor in real-time as requests come in

### Common Issues & Solutions

| Issue              | Cause                           | Solution                                                  |
| ------------------ | ------------------------------- | --------------------------------------------------------- |
| 500 Internal Error | Firebase not initialized        | Check `FIREBASE_CREDENTIALS_PATH`, ensure file exists     |
| 401 Unauthorized   | Invalid JWT                     | Ensure token is in `Authorization: Bearer <token>` header |
| CORS Error         | Frontend URL not in CORS config | Update `FRONTEND_URL` environment variable                |
| Database timeout   | Too many concurrent requests    | Implement rate limiting, scale Firestore                  |
| Agent failures     | Groq API issue                  | Check `GROQ_API_KEY`, API rate limits                     |

## Rollback Plan

If deployment fails:

1. Render automatically keeps previous versions
2. Go to Render dashboard → Service → Deployment
3. Select previous working deployment
4. Click "Rollback to this deployment"
5. Verify health check passes

## Scaling Considerations

As traffic grows:

1. **Increase Firestore capacity**: Monitor read/write usage in Firebase Console
2. **Add indexes**: Firestore will suggest missing indexes
3. **Implement caching**: Use Redis for frequently accessed data
4. **Rate limiting**: Implement stricter limits on submissions/uploads
5. **CDN for static assets**: If frontend uses many static files

## Monitoring Dashboard

Set up monitoring to track:

- [ ] API response times
- [ ] Error rates
- [ ] Database query times
- [ ] Agent execution times
- [ ] Server resource usage

## Contact & Support

For issues or questions:

1. Check application logs
2. Verify environment variables
3. Review Firebase console for errors
4. Check Groq API status
