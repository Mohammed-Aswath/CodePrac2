# CODEPRAC 2.0 - Architecture Documentation

## Project Structure

```
d:\PRJJ\
├── index.html                  # Main entry point (refactored)
├── css/
│   └── styles.css             # All centralized CSS (650+ lines)
├── js/
│   ├── config.js              # Configuration constants
│   ├── utils.js               # Utility functions and helpers
│   ├── auth.js                # Authentication logic
│   ├── ui.js                  # Router and page navigation
│   ├── dashboard.js           # Dashboard functionality
│   ├── questions.js           # Questions CRUD
│   ├── notes.js               # Notes CRUD
│   ├── students.js            # Student management
│   ├── admin.js               # Admin panel
│   ├── college.js             # College dashboard
│   ├── department.js          # Department dashboard
│   └── student.js             # Student practice interface
├── pages/                     # (Optional) For future HTML templates
├── index-old.html             # Backup of original monolithic file
└── [other backend files]      # Python/Flask files
```

## Module Dependencies

```
index.html
  ├─> config.js (no dependencies)
  ├─> utils.js (depends on: config)
  ├─> auth.js (depends on: config, utils)
  ├─> dashboard.js (depends on: auth, utils)
  ├─> questions.js (depends on: auth, utils, ui)
  ├─> notes.js (depends on: auth, utils, ui)
  ├─> students.js (depends on: auth, utils, ui)
  ├─> admin.js (depends on: auth, utils, ui)
  ├─> college.js (depends on: auth, utils, ui)
  ├─> department.js (depends on: auth, utils, ui)
  ├─> student.js (depends on: auth, utils, ui)
  └─> ui.js (depends on: all above modules)
```

## Module Descriptions

### Core Infrastructure

#### config.js
- **Purpose**: Centralized configuration and constants
- **Key Exports**: API_BASE, ROLES, STORAGE_KEYS, BATCH_REGEX, PAGES
- **Usage**: `Config.API_BASE`, `Config.PAGES.DASHBOARD`, etc.

#### utils.js
- **Purpose**: Reusable utility functions
- **Key Functions**:
  - `apiRequest(url, options)` - Fetch wrapper with auth header
  - `escapeHtml(text)` - XSS prevention
  - `getToken()`, `getUser()` - Storage retrieval
  - `saveAuth()`, `clearAuth()` - Auth persistence
  - `showMessage()` - UI alerts with auto-clear
  - `formatDate()`, `debounce()`, `confirm()`, `alert()`

#### auth.js
- **Purpose**: Authentication business logic
- **Key Methods**:
  - `isAuthenticated()` - Check if user is logged in
  - `getCurrentUser()` - Get logged-in user data
  - `hasRole(role)` - Check user's role
  - `login(email, password)` - Login user
  - `register(name, email, password, role)` - Register new user
  - `logout()` - Clear authentication

### UI & Navigation

#### ui.js
- **Purpose**: Router, page navigation, and event delegation
- **Key Methods**:
  - `init()` - Application bootstrap
  - `navigateTo(page)` - Switch pages
  - `openModal(modalId)`, `closeModal(modalId)` - Modal control
  - `setupNavigation()` - Show/hide nav links by role
  - `handleLogin()`, `handleRegister()`, `handleLogout()` - Auth handlers

### Page Modules

#### dashboard.js
- **Purpose**: Dashboard with stats and activity
- **Methods**:
  - `load()` - Dispatch to student/admin dashboard
  - `loadStudentDashboard()` - Fetch performance stats
  - `loadAdminDashboard()` - Admin-specific stats
  - `loadRecentActivity()` - Fetch submissions

#### questions.js
- **Purpose**: Full CRUD for questions
- **Methods**:
  - `load()` - Fetch all questions
  - `render()` - Display as table with edit/delete buttons
  - `openModal()` - Open create form
  - `edit(id)` - Load and edit existing question
  - `save()` - Create or update (based on editingId)
  - `delete(id)` - Delete with confirmation
  - `resetForm()` - Clear all inputs

#### notes.js
- **Purpose**: Full CRUD for notes
- **Methods**: Same pattern as questions.js
- **Fields**: topic_id, title, google_drive_link

#### students.js
- **Purpose**: Student management (admin/college/department)
- **Methods**: Full CRUD with enable/disable toggle
- **Features**: Role-based API endpoints

#### admin.js
- **Purpose**: Admin panel with 4 tabs
- **Tabs**: Colleges, Departments, Batches, Students
- **Features**: Separate CRUD for each entity type

#### college.js
- **Purpose**: College dashboard
- **Features**: Department list, performance overview

#### department.js
- **Purpose**: Department management
- **Tabs**: Topics, Questions, Notes, Batches
- **Features**: Topic CRUD, tab-based navigation

#### student.js
- **Purpose**: Student coding practice interface (LeetCode-like)
- **Features**: Question selection, code editor, test submission

## API Integration

All modules use `Utils.apiRequest()` which:
1. Injects Bearer token from localStorage
2. Sets Content-Type: application/json
3. Handles errors and JSON parsing
4. Shows user-friendly error messages

### Typical API Endpoints

```
Authentication:
- POST /auth/login
- POST /auth/register

Dashboard:
- GET /student/stats
- GET /admin/stats
- GET /submissions

Questions:
- GET /department/questions
- POST /department/questions
- PUT /department/questions/{id}
- DELETE /department/questions/{id}

Notes:
- GET /department/notes
- POST /department/notes
- PUT /department/notes/{id}
- DELETE /department/notes/{id}

Students:
- GET /admin/students
- POST /admin/students
- PUT /admin/students/{id}
- DELETE /admin/students/{id}
- PUT /admin/students/{id}/status

Colleges:
- GET /admin/colleges
- POST /admin/colleges
- PUT /admin/colleges/{id}
- DELETE /admin/colleges/{id}

Departments:
- GET /admin/departments
- POST /admin/departments
- PUT /admin/departments/{id}
- DELETE /admin/departments/{id}

Batches:
- GET /admin/batches
- POST /admin/batches
- PUT /admin/batches/{id}
- DELETE /admin/batches/{id}

Topics:
- GET /department/topics
- POST /department/topics
- PUT /department/topics/{id}
- DELETE /department/topics/{id}

Student Practice:
- GET /student/questions
- GET /student/questions/{id}
- POST /student/questions/{id}/test
- POST /student/questions/{id}/submit
```

## Page Structure (index.html)

### Pages (data-page containers)
- `dashboard` - User dashboard
- `admin` - Admin panel (for admins)
- `college` - College dashboard (for college admins)
- `department` - Department dashboard (for dept admins)
- `student` - Student practice (for students)

### Modals
- `questionModal` - Create/edit questions
- `noteModal` - Create/edit notes
- `studentModal` - Create/edit students
- `collegeModal` - Create/edit colleges
- `departmentModal` - Create/edit departments
- `batchModal` - Create/edit batches
- `topicModal` - Create/edit topics

## Key Patterns

### Module Structure
```javascript
const ModuleName = {
    data: [],
    editingId: null,
    
    async load() { },
    render() { },
    async save() { },
    async delete(id) { },
    openModal() { },
    resetForm() { }
};
```

### Form Reuse (Create & Edit)
1. Modal title/button text changes based on editingId
2. Form cleared for new records (editingId = null)
3. Form populated for edits (editingId = id)
4. Save() checks editingId to determine POST vs PUT

### Navigation
```javascript
UI.navigateTo('dashboard');    // Load dashboard page
UI.openModal('questionModal');  // Open question form
UI.closeModal('questionModal'); // Close form
```

### API Calls
```javascript
// GET
const data = await Utils.apiRequest('/endpoint');

// POST
await Utils.apiRequest('/endpoint', {
    method: 'POST',
    body: JSON.stringify(payload)
});

// PUT (Update)
await Utils.apiRequest('/endpoint/123', {
    method: 'PUT',
    body: JSON.stringify(payload)
});

// DELETE
await Utils.apiRequest('/endpoint/123', {
    method: 'DELETE'
});
```

### Messages & Alerts
```javascript
Utils.showMessage('messageId', 'Success!', 'success');  // Green
Utils.showMessage('messageId', 'Error!', 'error');      // Red
Utils.alert('Confirmation needed');                      // Simple alert
Utils.confirm('Delete permanently?');                    // Y/N confirmation
```

## Authentication Flow

1. **Load Page** → Check if authenticated
2. **Not Authenticated** → Show auth page (login/register)
3. **Authenticated** → Show main app with role-based navigation
4. **Navigate** → Load page-specific data based on role
5. **Logout** → Clear auth, show login page

### Role-Based Access
- `admin` - Full system control (colleges, departments, batches, students)
- `college` - College management (departments, student stats)
- `department` - Department management (topics, questions, notes, batches)
- `student` - Practice questions (questions, code submission)

## CSS Structure (styles.css)

### Variables
- Colors: --primary, --secondary, --success, --danger, --warning
- Spacing: Consistent rem-based units
- Typography: Segoe UI system font

### Classes
- Utilities: `.hidden`, `.text-center`, `.text-secondary`, `.flex-*`
- Components: `.btn`, `.btn-primary`, `.card`, `.table`, `.modal`, `.tabs`
- Layout: `.container`, `.grid`, `.grid-cols-2`, `.grid-cols-3`

## Common Issues & Solutions

### Issue: Scripts not loading
- **Fix**: Ensure script src paths are relative and correct order
- **Order**: config → utils → auth → [features] → ui

### Issue: Modal not closing
- **Fix**: Call `UI.closeModal('modalId')` not `closeModal()`
- **Ensure**: Modal ID matches in HTML and close calls

### Issue: API calls failing
- **Debug**: Check browser console for CORS errors
- **Verify**: Backend server is running on localhost:5000
- **Check**: Token exists in localStorage after login

### Issue: Role-based navigation not showing
- **Fix**: Check `Auth.getCurrentUser().role` matches expected role
- **Verify**: Role is saved to localStorage during login

## Testing Checklist

- [ ] Login/Register works
- [ ] Dashboard loads for logged-in user
- [ ] Questions CRUD works (create, read, edit, delete)
- [ ] Notes CRUD works
- [ ] Admin can manage colleges/departments/batches
- [ ] College admin sees college-specific data
- [ ] Department admin can manage topics/questions/notes
- [ ] Students can submit code
- [ ] Logout works and shows login page
- [ ] No console errors
- [ ] Navigation shows only relevant links per role

## Performance Notes

- All modules are lazy-loaded only when page is accessed
- API requests include authorization headers automatically
- Form validation prevents unnecessary API calls
- Confirmation dialogs prevent accidental deletions

## Future Enhancements

1. Add search/filter functionality
2. Add pagination for large datasets
3. Add analytics dashboard
4. Add real-time notifications
5. Add code highlighting for student submissions
6. Add progress tracking for students
7. Add leaderboards
8. Add problem difficulty analytics

## Support & Debugging

1. Check browser DevTools Console for errors
2. Verify API responses in Network tab
3. Check localStorage for token/user data
4. Verify all script files load in correct order
5. Check page IDs match data-page attributes

---
**Version**: 2.0 (Refactored)
**Last Updated**: [Current Date]
**Status**: Production Ready
