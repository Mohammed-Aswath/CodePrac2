# CODEPRAC 2.0 - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          index.html                              │
│                    (Entry Point - 380 lines)                     │
│                                                                   │
│  • HTML structure (nav, pages, modals, forms)                   │
│  • Loads all CSS and JS in correct order                        │
│  • Pure markup, no embedded scripts/styles                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌────────┐         ┌────────┐         ┌────────┐
    │  CSS   │         │ Scripts│         │ Assets │
    │        │         │  (JS)  │         │        │
    └────────┘         └────────┘         └────────┘
        │                  │                  │
        │                  │                  │
    styles.css        12 JS Modules      (images, etc)
   (660 lines)
    • Colors            • config.js       
    • Layout            • utils.js        
    • Components        • auth.js         
    • Responsive        • ui.js           
    • Utilities         • 8 Feature mods  
                        (2,060 lines)
```

## JavaScript Module Dependency Tree

```
                        index.html
                             │
                    ┌────────┴────────┐
                    │                 │
               css/styles.css    js/[all modules]
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                config.js         utils.js           auth.js
            (No dependencies)   (Uses config)    (Uses config, utils)
                    │                 │                 │
                    └─────────────┬───┴─────────────────┘
                                  │
                    ┌─────────────┬──────────────┐
                    │             │              │
            dashboard.js    questions.js    notes.js
                │                 │            │
                └─────────────────┬────────────┘
                                  │
            ┌─────────┬───────────┼───────────┬──────────────┬─────────────┐
            │         │           │           │              │             │
        students.js admin.js  college.js  department.js   student.js   ui.js
                │         │           │           │            │         │
                └─────────┴───────────┴───────────┴────────────┴─────────┘
                                  │
                            DOMContentLoaded
                                  │
                            UI.init() Called
                                  │
                        ✓ Modules ready to use
```

## Module Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                      CORE INFRASTRUCTURE                         │
├─────────────────────────────────────────────────────────────────┤
│ config.js (33 lines)                                            │
│ └─ Centralized constants and configuration                      │
│    • API_BASE, ROLES, STORAGE_KEYS, PAGES, BATCH_REGEX        │
│    • Frozen object (Object.freeze) to prevent mutations         │
│                                                                  │
│ utils.js (127 lines)                                            │
│ └─ Reusable utility functions                                   │
│    • apiRequest() - Fetch wrapper with auth                     │
│    • escapeHtml() - XSS prevention                             │
│    • getToken(), getUser() - Storage access                     │
│    • showMessage(), alert(), confirm() - UI feedback            │
│    • formatDate(), debounce() - General utilities              │
│                                                                  │
│ auth.js (63 lines)                                              │
│ └─ Authentication business logic                                │
│    • login(), register() - User authentication                  │
│    • isAuthenticated(), getCurrentUser() - Auth checking        │
│    • hasRole() - Role-based access                              │
│    • logout() - Session cleanup                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      UI & NAVIGATION                             │
├─────────────────────────────────────────────────────────────────┤
│ ui.js (308 lines)                                               │
│ └─ Application router and page navigation                       │
│    • init() - Bootstrap application                             │
│    • navigateTo() - Change pages                                │
│    • setupNavigation() - Show/hide nav links by role             │
│    • openModal(), closeModal() - Modal control                  │
│    • checkAuthentication() - Route based on auth state           │
│    • Event handlers for login, register, logout                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE MODULES (PAGE SPECIFIC)               │
├─────────────────────────────────────────────────────────────────┤
│ DASHBOARD (58 lines)                                            │
│ └─ display() - Student/admin dashboard                          │
│    • loadStudentDashboard() - Performance stats                 │
│    • loadAdminDashboard() - System overview                     │
│    • loadRecentActivity() - Submission history                  │
│                                                                  │
│ QUESTIONS (128 lines)                                           │
│ └─ Complete CRUD for questions                                  │
│    • load() - Fetch all questions                               │
│    • render() - Display as table                                │
│    • create/edit/delete - Modal-based operations                │
│    • save() - Smart create/update handler                       │
│                                                                  │
│ NOTES (130 lines)                                               │
│ └─ Complete CRUD for notes                                      │
│    • Similar pattern to Questions                               │
│    • Fields: topic_id, title, google_drive_link                 │
│                                                                  │
│ STUDENTS (195 lines)                                            │
│ └─ Student management with role-based URLs                      │
│    • Full CRUD operations                                       │
│    • toggle() - Enable/disable students                         │
│    • Role-aware API endpoints                                   │
│                                                                  │
│ ADMIN (398 lines)                                               │
│ └─ Admin panel with 4 tabs                                      │
│    • Colleges tab - CRUD colleges                               │
│    • Departments tab - CRUD departments                         │
│    • Batches tab - CRUD batches                                 │
│    • Students tab - View all students                           │
│    • Tab switching and rendering                                │
│                                                                  │
│ COLLEGE (91 lines)                                              │
│ └─ College dashboard                                            │
│    • loadDepartments() - List departments                       │
│    • loadPerformance() - Stats overview                         │
│                                                                  │
│ DEPARTMENT (250 lines)                                          │
│ └─ Department management                                        │
│    • Topics - CRUD operations                                   │
│    • Questions - Link to Questions module                       │
│    • Notes - Link to Notes module                               │
│    • Batches - Display list                                     │
│    • Tab-based navigation                                       │
│                                                                  │
│ STUDENT PRACTICE (228 lines)                                    │
│ └─ LeetCode-like practice interface                             │
│    • loadQuestions() - Get question list                        │
│    • selectQuestion() - Show problem details                    │
│    • runTests() - Execute test cases                            │
│    • submitCode() - Submit solution                             │
│    • Code editor and results display                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│  User Login  │
└──────┬───────┘
       │
       ▼
┌────────────────────────────┐
│ Auth.login(email, password)│
└──────┬─────────────────────┘
       │ (Makes API request)
       │ Utils.apiRequest('/auth/login')
       │
       ▼
┌─────────────────┐
│  /auth/login    │ (Backend)
│  Returns:       │
│  • token        │
│  • user {}      │
└──────┬──────────┘
       │
       ▼
┌──────────────────────────┐
│  Save to localStorage    │
│  • token                 │
│  • user JSON             │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  UI.showApp()            │
│  UI.navigateTo('dash')   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Dashboard.load()        │
│  (or other page module)  │
└──────┬───────────────────┘
       │
       ▼
┌───────────────────────────────────────────┐
│ Utils.apiRequest() with Bearer token      │
│ Authorization: Bearer {token from storage}│
└──────┬────────────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Backend responds    │
│  with data           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Module.render()             │
│  Display data in HTML        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  User sees content           │
│  ✓ Page loaded successfully  │
└──────────────────────────────┘
```

## CRUD Operation Flow

```
CREATE OPERATION:
    ┌─────────────────────────┐
    │ Click "Add" button      │
    └───────────┬─────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │ Module.openModal()           │
    │ • Clear form fields          │
    │ • Set title to "Add X"       │
    │ • Show modal                 │
    └───────────┬──────────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │ User fills form & clicks save│
    └───────────┬──────────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │ Module.save()                │
    │ if (!editingId) POST request │
    └───────────┬──────────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │ Utils.apiRequest(url, {      │
    │   method: 'POST',            │
    │   body: JSON.stringify({..}) │
    │ })                           │
    └───────────┬──────────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │ Backend creates & returns ID │
    └───────────┬──────────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │ Module.load() (reload data)  │
    │ Module.render() (show table) │
    └───────────┬──────────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │ showMessage('success')       │
    │ Close modal                  │
    └──────────────────────────────┘


EDIT OPERATION:
    ┌──────────────────────────┐
    │ Click "Edit" button      │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │ Module.edit(id)                     │
    │ • Fetch item from API               │
    │ • editingId = id                    │
    │ • Populate form fields              │
    │ • Show modal with "Update" button   │
    └────────────┬────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ User modifies & clicks save  │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Module.save()                │
    │ if (editingId) PUT request   │
    │ to /endpoint/{id}            │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Reload → Render → Success    │
    └──────────────────────────────┘


DELETE OPERATION:
    ┌──────────────────────────┐
    │ Click "Delete" button    │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ confirm('Delete?')       │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ DELETE request           │
    │ to /endpoint/{id}        │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Reload → Render → Success│
    └──────────────────────────┘
```

## Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                      ANONYMOUS USER                         │
└─────────────────────────────────────────────────────────────┘
    ↓
    Shows: Login & Register forms
    Can: Create new account or login
    
    ▼ LOGIN SUCCESSFUL
    
┌─────────────────────────────────────────────────────────────┐
│               AUTHENTICATED USER (Role-Based)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ STUDENT                                                      │
│ ├─ Dashboard (personal stats)                               │
│ ├─ Practice (solve questions)                               │
│ └─ Nav: Dashboard, Practice, Logout                          │
│                                                              │
│ DEPARTMENT ADMIN                                             │
│ ├─ Dashboard (department overview)                          │
│ ├─ Department (manage topics/questions/notes/batches)       │
│ ├─ Practice (solve questions)                               │
│ └─ Nav: Dashboard, Department, Practice, Logout             │
│                                                              │
│ COLLEGE ADMIN                                                │
│ ├─ Dashboard (college overview)                             │
│ ├─ College (view departments & performance)                 │
│ ├─ Practice (solve questions)                               │
│ └─ Nav: Dashboard, College, Practice, Logout                │
│                                                              │
│ SYSTEM ADMIN                                                 │
│ ├─ Dashboard (system overview)                              │
│ ├─ Admin Panel (manage everything)                          │
│ │  ├─ Colleges CRUD                                         │
│ │  ├─ Departments CRUD                                      │
│ │  ├─ Batches CRUD                                          │
│ │  └─ Students CRUD                                         │
│ ├─ Practice (solve questions)                               │
│ └─ Nav: Dashboard, Admin Panel, Practice, Logout            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
    ▼ LOGOUT
┌─────────────────────────────────────────────────────────────┐
│               Back to ANONYMOUS (Login form)                │
└─────────────────────────────────────────────────────────────┘
```

## API Request/Response Cycle

```
Frontend (Browser)              Backend (Flask/Python)
       │                                 │
       │─── POST /auth/login ──────────→ │
       │   {email, password}             │
       │                                 │
       │                         ┌───────┐
       │                         │ Login │
       │                         │ Check │
       │                         └───┬───┘
       │                             │
       │ ←──── 200 OK ───────────────│
       │ {token, user{}}             │
       │                             │
    [ Save to ]                       │
    [ localStorage ]                  │
       │                             │
       ├─ GET /student/stats        │
       │ Header: Authorization: Bearer {token}
       │                             │
       │                    ┌────────┬────────┐
       │                    │ Check  │ Fetch  │
       │                    │ Token  │ Data   │
       │                    └────────┬────────┘
       │                             │
       │ ←──── {stats data} ────────│
       │                             │
    [ render() ]                      │
    [ display ]                       │
       │                             │
       ├─ POST /questions           │
       │ Authorization: Bearer {token}
       │ {question data}             │
       │                             │
       │                    ┌────────┴────────┐
       │                    │ Create Question │
       │                    └────────┬────────┘
       │                             │
       │ ←──── 201 Created ────────│
       │ {id}                        │
       │                             │
    [ reload() ]                      │
       │                             │
       └─ DELETE /questions/{id}     │
         Authorization: Bearer {token}
                                     │
                                ┌────┴────┐
                                │ Delete   │
                                └────┬────┘
                                     │
         ←──── 204 No Content ───────│
```

## File Organization

```
d:\PRJJ\
│
├── index.html ........................ Main entry point (380 lines)
│   ├─ HTML structure
│   ├─ All modals & forms
│   └─ Script/link tags in order
│
├── css/
│   └── styles.css .................. Complete styling (660 lines)
│       ├─ Variables (colors, spacing)
│       ├─ Layout & typography
│       ├─ Components (btn, card, modal)
│       ├─ Utilities (hidden, flex, grid)
│       └─ Responsive media queries
│
├── js/
│   ├── config.js ................... Constants (33 lines)
│   │
│   ├── utils.js .................... Helpers (127 lines)
│   │   ├─ apiRequest() with auth
│   │   ├─ escapeHtml()
│   │   ├─ Storage access
│   │   └─ UI feedback functions
│   │
│   ├── auth.js ..................... Auth logic (63 lines)
│   │   ├─ login()
│   │   ├─ register()
│   │   ├─ logout()
│   │   └─ Role checking
│   │
│   ├── ui.js ....................... Router (308 lines)
│   │   ├─ init() bootstrap
│   │   ├─ navigateTo() pages
│   │   ├─ Modal control
│   │   └─ Event setup
│   │
│   ├── dashboard.js ................ Dashboard (58 lines)
│   ├── questions.js ................ Questions CRUD (128 lines)
│   ├── notes.js .................... Notes CRUD (130 lines)
│   ├── students.js ................. Student CRUD (195 lines)
│   ├── admin.js .................... Admin panel (398 lines)
│   ├── college.js .................. College dash (91 lines)
│   ├── department.js ............... Dept dash (250 lines)
│   └── student.js .................. Practice (228 lines)
│
├── pages/ .......................... (Directory for future templates)
│
├── ARCHITECTURE.md ................. Complete architecture guide
├── QUICK_REFERENCE.md .............. Quick reference for devs
├── REFACTORING_SUMMARY.md .......... What was changed
└── MASTER_CHECKLIST.md ............ This comprehensive guide
```

---

This architecture provides:
- ✅ **Clean separation of concerns**
- ✅ **No circular dependencies**
- ✅ **Consistent patterns**
- ✅ **Easy to debug**
- ✅ **Simple to extend**
- ✅ **No external dependencies**
