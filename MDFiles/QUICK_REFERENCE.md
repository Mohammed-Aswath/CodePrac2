# Quick Reference - CODEPRAC 2.0 CRUD Modules

## Global Objects Available

### Configuration
- `window.CONFIG` or `window.Config` → Central configuration
  - `API_BASE_URL` → Base URL for all API calls
  - `ROLES` → Role constants
  - `PAGES` → Page names

### Admin CRUD Modules (System Admin Only)
- `window.Admin` → Manage colleges, departments, batches, students
- `window.AdminTopics` → Create/edit/delete topics (requires hierarchy)
- `window.AdminNotes` → Create/edit/delete notes (requires hierarchy)
- `window.Questions` → Questions management with RBAC

### Batch CRUD Modules (Batch Admin Only)
- `window.Batch` → Manage students in batch
- `window.BatchTopics` → Create/edit/delete topics (implicit scope)
- `window.BatchNotes` → Create/edit/delete notes (implicit scope)

### Feature Modules
- `window.College` → College admin features
- `window.Department` → Department admin features
- `window.Student` → Student practice features
- `window.Dashboard` → Dashboard logic
- `window.Utils` → Utility functions
- `window.UI` → UI helpers

---

## Common Operations

### Open Modals
```javascript
// Admin Topics
AdminTopics.openModal();           // Create
AdminTopics.openModal(topicId);    // Edit

// Admin Notes
AdminNotes.openModal();            // Create
AdminNotes.openModal(noteId);      // Edit

// Batch Topics
BatchTopics.openModal();           // Create
BatchTopics.openModal(topicId);    // Edit

// Batch Notes
BatchNotes.openModal();            // Create
BatchNotes.openModal(noteId);      // Edit
```

### Load Data
```javascript
// Load all topics (admin)
AdminTopics.loadTopics();

// Load all notes (admin)
AdminNotes.loadNotes();

// Load all topics (batch)
BatchTopics.loadTopics();

// Load all notes (batch)
BatchNotes.loadNotes();
```

### Direct API Calls
```javascript
// All use same base
const endpoint = `${CONFIG.API_BASE_URL}/admin/topics`;
const token = localStorage.getItem('token');

// Create
fetch(endpoint, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic_name: 'New Topic', college_id, department_id, batch_id })
});

// Read
fetch(`${endpoint}/${id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Update
fetch(`${endpoint}/${id}`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic_name: 'Updated' })
});

// Delete
fetch(`${endpoint}/${id}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## UI Tabs Structure

### Admin Panel Tabs
- Colleges (list/manage all colleges)
- Departments (list/manage all departments)
- Batches (list/manage all batches)
- Students (list/manage all students)
- **Topics** (list/manage topics with hierarchy) ← NEW
- **Questions** (list/manage questions with hierarchy) ← NEW
- **Notes** (list/manage notes with hierarchy) ← NEW

### Batch Panel Tabs
- Students (list/manage students in batch)
- **Topics** (list/manage topics for batch) ← NEW
- Questions (list questions for batch)
- **Notes** (list/manage notes for batch) ← NEW

---

## Hierarchy Selection Flow

### System Admin Creating Content
```
1. Select College (dropdown, all enabled)
     ↓
2. Department dropdown populated (filtered by college)
     ↓
3. Select Department
     ↓
4. Batch dropdown populated (filtered by department)
     ↓
5. Select Batch
     ↓
6. Fill content fields (topic_name, title, etc.)
     ↓
7. Submit → API receives: { topic_name, college_id, department_id, batch_id }
```

### Batch Admin Creating Content
```
1. No dropdowns shown (scope implicit from token)
     ↓
2. Fill content fields (topic_name, title, etc.)
     ↓
3. Submit → API receives: { topic_name } (batch_id from token)
```

---

## HTML Event Handlers

### In index.html
```html
<!-- Open Admin Topic Modal -->
<button onclick="AdminTopics.openModal()">Add Topic</button>

<!-- Open Admin Note Modal -->
<button onclick="AdminNotes.openModal()">Add Note</button>

<!-- Open Batch Topic Modal -->
<button onclick="BatchTopics.openModal()">Add Topic</button>

<!-- Open Batch Note Modal -->
<button onclick="BatchNotes.openModal()">Add Note</button>

<!-- Save (in modal footer) -->
<button type="submit" onclick="AdminTopics.save()">Create Topic</button>
<button type="submit" onclick="AdminNotes.save()">Create Note</button>
<button type="submit" onclick="BatchTopics.save()">Create Topic</button>
<button type="submit" onclick="BatchNotes.save()">Create Note</button>
```

---

## Form Fields & Validation

### Admin Topics Form
- College (required, select)
- Department (required, select, filtered)
- Batch (required, select, filtered)
- Topic Name (required, min 2 chars)

### Admin Notes Form
- College (required, select)
- Department (required, select, filtered)
- Batch (required, select, filtered)
- Title (required, min 2 chars)
- Google Drive Link (required, URL format validation)

### Batch Topics Form
- Topic Name (required, min 2 chars)

### Batch Notes Form
- Title (required, min 2 chars)
- Google Drive Link (required, URL format validation)

---

## Error Messages

All modules use `UI.showMessage()`:
```javascript
UI.showMessage(containerId, message, type);
// type: 'success', 'error', 'warning', 'info'
```

Example:
```javascript
UI.showMessage('adminTopicsMessage', 'Topic created successfully', 'success');
UI.showMessage('adminTopicsMessage', 'Missing college selection', 'error');
```

---

## Debugging

### Console Validation
```javascript
// Check all modules are loaded
console.log('AdminTopics:', typeof AdminTopics);
console.log('AdminNotes:', typeof AdminNotes);
console.log('BatchTopics:', typeof BatchTopics);
console.log('BatchNotes:', typeof BatchNotes);
console.log('CONFIG:', CONFIG);

// Check token exists
console.log('Token:', localStorage.getItem('token'));

// Check user role
const token = localStorage.getItem('token');
// Decode JWT (requires jwt-decode or manual parsing)
```

### API Testing
```javascript
// Test topic creation (admin)
fetch(CONFIG.API_BASE_URL + '/admin/topics', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic_name: 'Test Topic',
    college_id: 'col123',
    department_id: 'dept456',
    batch_id: 'batch789'
  })
}).then(r => r.json()).then(d => console.log(d));
```

---

## File Locations

| Module | File | Lines | Purpose |
|--------|------|-------|---------|
| Config | `js/config.js` | 33 | Central configuration, globals |
| Admin Core | `js/admin.js` | 1207 | Admin dashboard, hierarchy management |
| Admin Topics | `js/admin-topics.js` | 314 | System admin topic CRUD |
| Admin Notes | `js/admin-notes.js` | 361 | System admin note CRUD |
| Batch Core | `js/batch.js` | 454 | Batch dashboard, student management |
| Batch Topics | `js/batch-topics.js` | 220 | Batch admin topic CRUD |
| Batch Notes | `js/batch-notes.js` | 273 | Batch admin note CRUD |
| HTML | `index.html` | 938 | UI structure, modals, tabs |

---

## Related Backend Files

| Endpoint | File | Route |
|----------|------|-------|
| Topics Admin | `routes/admin.py` | `/api/admin/topics/*` |
| Topics Batch | `routes/batch.py` | `/api/batch/topics/*` |
| Notes Admin | `routes/admin.py` | `/api/admin/notes/*` |
| Notes Batch | `routes/batch.py` | `/api/batch/notes/*` |
| Topic Service | `topic_service.py` | Business logic |
| Note Service | `note_service.py` | Business logic |

---

## Known Limitations

1. Questions.loadAdminQuestions() not yet implemented
2. Student read-only note access not yet implemented
3. No pagination for large topic/note lists
4. No bulk operations (edit/delete multiple)
5. No offline support
6. No real-time sync between admins

