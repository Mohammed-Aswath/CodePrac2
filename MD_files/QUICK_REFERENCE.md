# Quick Reference Guide - CODEPRAC 2.0 Modular Architecture

## File Tree (What Got Changed)

### BEFORE (Monolithic)
```
index.html (3,055 lines)  ← Everything: HTML, CSS, JavaScript mixed together
```

### AFTER (Modular)
```
index.html (380 lines)    ← Clean entry point with script/link tags
├── css/styles.css        ← All styling (660 lines)
└── js/
    ├── config.js         ← Constants
    ├── utils.js          ← Helpers
    ├── auth.js           ← Login/register/logout
    ├── ui.js             ← Router & navigation
    ├── dashboard.js      ← Dashboard page
    ├── questions.js      ← Questions CRUD
    ├── notes.js          ← Notes CRUD
    ├── students.js       ← Student management
    ├── admin.js          ← Admin panel
    ├── college.js        ← College dashboard
    ├── department.js     ← Department dashboard
    └── student.js        ← Practice interface
```

## How to Use

### Starting the Application
```bash
# 1. Start backend
python app.py

# 2. Open in browser
# Option A: Direct file
open d:\PRJJ\index.html

# Option B: Local server
python -m http.server 8000
# Then visit http://localhost:8000
```

### Making API Calls
```javascript
// Every module uses Utils.apiRequest() which auto-injects token

// GET request
const data = await Utils.apiRequest('/department/questions');
console.log(data.questions);

// POST request
await Utils.apiRequest('/department/questions', {
    method: 'POST',
    body: JSON.stringify({
        topic_id: '123',
        title: 'Two Sum Problem',
        description: '...'
    })
});

// PUT request (update)
await Utils.apiRequest('/department/questions/456', {
    method: 'PUT',
    body: JSON.stringify({ title: 'New Title' })
});

// DELETE request
await Utils.apiRequest('/department/questions/456', {
    method: 'DELETE'
});
```

### Common Tasks

#### Show a Page
```javascript
UI.navigateTo('dashboard');
UI.navigateTo('admin');
UI.navigateTo('college');
UI.navigateTo('department');
UI.navigateTo('student');
```

#### Open/Close a Modal
```javascript
// Open
UI.openModal('questionModal');

// Close
UI.closeModal('questionModal');
```

#### Show Message to User
```javascript
// Success message (green)
Utils.showMessage('messageId', 'Question created!', 'success');

// Error message (red)
Utils.showMessage('messageId', 'Failed to save', 'error');

// Simple alert
Utils.alert('Are you sure?');

// Confirm dialog
if (Utils.confirm('Delete permanently?')) {
    // User clicked OK
}
```

#### Check User Role
```javascript
const user = Auth.getCurrentUser();
if (user.role === 'admin') {
    // Is admin
}

// Or use helper
if (Auth.hasRole('admin')) {
    // Is admin
}
```

#### Load and Display Data
```javascript
// Pattern used in all modules:
const Module = {
    data: [],
    
    async load() {
        try {
            const response = await Utils.apiRequest('/endpoint');
            this.data = response.data?.items || [];
            this.render();  // Display it
        } catch (error) {
            Utils.showMessage('messageId', error.message, 'error');
        }
    },
    
    render() {
        const container = document.getElementById('itemsList');
        container.innerHTML = this.data.map(item => `
            <div class="card">
                <p>${Utils.escapeHtml(item.name)}</p>
                <button onclick="Module.delete('${item.id}')">Delete</button>
            </div>
        `).join('');
    }
};
```

## Common Patterns

### Form Create/Edit Pattern
```javascript
const Module = {
    editingId: null,
    
    // Open for creating new
    openModal() {
        this.editingId = null;
        this.resetForm();
        document.querySelector('#modal h3').textContent = 'Add Item';
        document.querySelector('#modal [type="submit"]').textContent = 'Create';
        UI.openModal('modal');
    },
    
    // Open for editing existing
    async edit(id) {
        const response = await Utils.apiRequest(`/endpoint/${id}`);
        const item = response.data?.item || {};
        
        document.getElementById('field1').value = item.field1;
        document.getElementById('field2').value = item.field2;
        
        this.editingId = id;
        document.querySelector('#modal h3').textContent = 'Edit Item';
        document.querySelector('#modal [type="submit"]').textContent = 'Update';
        UI.openModal('modal');
    },
    
    // Save (handles both create and update)
    async save() {
        const payload = {
            field1: document.getElementById('field1').value,
            field2: document.getElementById('field2').value
        };
        
        const url = this.editingId 
            ? `/endpoint/${this.editingId}`
            : '/endpoint';
        
        const method = this.editingId ? 'PUT' : 'POST';
        
        await Utils.apiRequest(url, {
            method,
            body: JSON.stringify(payload)
        });
        
        this.load();  // Reload data
        UI.closeModal('modal');
        Utils.showMessage('messageId', 'Saved!', 'success');
    },
    
    async delete(id) {
        if (!Utils.confirm('Delete permanently?')) return;
        
        await Utils.apiRequest(`/endpoint/${id}`, {
            method: 'DELETE'
        });
        
        this.load();
        Utils.showMessage('messageId', 'Deleted!', 'success');
    },
    
    resetForm() {
        document.getElementById('field1').value = '';
        document.getElementById('field2').value = '';
    }
};
```

## Adding a New Feature

### Step 1: Create Module (js/newfeature.js)
```javascript
const NewFeature = {
    items: [],
    
    async load() {
        const response = await Utils.apiRequest('/endpoint');
        this.items = response.data?.items || [];
        this.render();
    },
    
    render() {
        const container = document.getElementById('itemsList');
        container.innerHTML = this.items.map(item => `
            <div>${item.name}</div>
        `).join('');
    }
};
```

### Step 2: Add to index.html
```html
<!-- Add page section -->
<div id="featurePage" data-page="newfeature" class="hidden">
    <h1>New Feature</h1>
    <div id="itemsList"></div>
</div>

<!-- Add to navigation -->
<li><a href="#" data-nav="newfeature">New Feature</a></li>

<!-- Add script tag (before ui.js)-->
<script src="js/newfeature.js"></script>
```

### Step 3: Register in config.js
```javascript
PAGES: {
    // ... existing pages ...
    NEWFEATURE: 'newfeature'
}
```

### Step 4: Handle in ui.js
```javascript
case Config.PAGES.NEWFEATURE:
    if (typeof NewFeature !== 'undefined') {
        await NewFeature.load();
    }
    break;
```

## Debugging

### Check Browser Console
```javascript
// See if modules loaded
console.log(typeof Config);     // "object"
console.log(typeof Utils);      // "object"
console.log(typeof Auth);       // "object"
console.log(typeof UI);         // "object"
```

### Check Authentication
```javascript
// Is user logged in?
Auth.isAuthenticated()          // true/false

// What's the current user?
Auth.getCurrentUser()           // { id, name, role, ... }

// What's the token?
localStorage.getItem('token')   // "eyJhbGc..."
```

### Check API Call
```javascript
// Enable verbose logging
const response = await Utils.apiRequest('/endpoint');
console.log(response);          // See full response
```

### Check Page State
```javascript
// What page is shown?
console.log(document.querySelector('[data-page]:not(.hidden)'));

// What modals are open?
console.log(document.querySelectorAll('.modal.active'));
```

## CSS Customization

### Change Colors
```css
/* In css/styles.css */
:root {
    --primary: #2563eb;        /* Main color */
    --primary-dark: #1e40af;   /* Darker shade */
    --secondary: #64748b;      /* Secondary */
    --success: #16a34a;        /* Success */
    --danger: #dc2626;         /* Danger/Delete */
    --warning: #ea580c;        /* Warning */
    --light: #f1f5f9;          /* Light bg */
    --dark: #1e293b;           /* Dark text */
}
```

### Common CSS Classes
```html
<div class="container">                    <!-- Max width wrapper -->
<div class="hidden">                       <!-- Display: none -->
<div class="text-center">                 <!-- Text align center -->
<div class="text-secondary">              <!-- Gray text -->
<div class="text-${color}">               <!-- Color text -->
<div class="grid grid-cols-2">            <!-- 2 column grid -->
<div class="grid grid-cols-3">            <!-- 3 column grid -->
<div class="flex-between">                <!-- Space between flex -->
<div class="flex-gap">                    <!-- Gap in flex -->
<button class="btn">                      <!-- Basic button -->
<button class="btn btn-primary">          <!-- Blue button -->
<button class="btn btn-secondary">        <!-- Gray button -->
<button class="btn btn-danger">           <!-- Red button -->
<button class="btn btn-sm">               <!-- Small button -->
<div class="card">                        <!-- Elevated container -->
<div class="table">                       <!-- Table styling -->
<div class="modal">                       <!-- Modal popup -->
<div class="badge badge-success">         <!-- Success badge -->
```

## Script Load Order (Important!)

The scripts MUST load in this order (already correct in index.html):

1. **config.js** - Defines all constants
2. **utils.js** - Uses Config
3. **auth.js** - Uses Config, Utils
4. **dashboard.js** - Uses Auth, Utils
5. **questions.js** - Uses Auth, Utils
6. **notes.js** - Uses Auth, Utils
7. **students.js** - Uses Auth, Utils
8. **admin.js** - Uses Auth, Utils
9. **college.js** - Uses Auth, Utils
10. **department.js** - Uses Auth, Utils
11. **student.js** - Uses Auth, Utils
12. **ui.js** - Uses all of above

> ⚠️ If you change the order, things will break!

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Module is not defined" | Check script load order in index.html |
| API calls failing | Check backend is running on :5000 |
| Login doesn't work | Check `/auth/login` endpoint exists |
| Page doesn't load | Check data-page ID matches HTML element |
| Modal won't close | Use UI.closeModal() not just closeModal() |
| Styles not applied | Check css/styles.css is linked in index.html |
| Button doesn't work | Check onclick calls right function (e.g., Questions.save()) |
| Data not showing | Check API response format and data extraction |

## Environment Variables

```javascript
// In js/config.js
const Config = {
    API_BASE: 'http://localhost:5000/api',  // Change here for different API
    // ... rest of config
};
```

For production, change to:
```javascript
API_BASE: 'https://api.example.com/api'
```

## That's It! 🎉

You now have a fully modular, production-ready application with:
- ✅ Clean separation of concerns
- ✅ Consistent patterns across all code
- ✅ Easy to add new features
- ✅ Easy to debug and maintain
- ✅ No external dependencies
- ✅ Professional-grade vanilla JavaScript

Happy coding! 🚀
