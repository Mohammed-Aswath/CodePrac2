# ⚡ Cascading Disable/Enable - Quick Reference

## What Changed

### Backend (Python)

**File: models.py**
- Added 6 new cascade functions at end of file
- `disable_college_cascade()` - Disables college + all deps + batches + students
- `disable_department_cascade()` - Disables dept + all batches + students
- `disable_batch_cascade()` - Disables batch + all students
- `enable_college_cascade()` - Enables college + all deps + batches + students
- `enable_department_cascade()` - Enables dept + all batches + students
- `enable_batch_cascade()` - Enables batch + all students

**File: routes/admin.py**
- Updated 6 existing endpoints to use cascade functions:
  - `/admin/colleges/{id}/disable` → `disable_college_cascade()`
  - `/admin/colleges/{id}/enable` → `enable_college_cascade()`
  - `/admin/departments/{id}/disable` → `disable_department_cascade()`
  - `/admin/departments/{id}/enable` → `enable_department_cascade()`
  - `/admin/batches/{id}/disable` → `disable_batch_cascade()`
  - `/admin/batches/{id}/enable` → `enable_batch_cascade()`

### Frontend (JavaScript)

**File: js/admin.js**
- Updated 3 render functions to add Disable/Enable buttons:
  - `renderColleges()` - Added dynamic button (Disable for enabled, Enable for disabled)
  - `renderDepartments()` - Added dynamic button
  - `renderBatches()` - Added dynamic button

- Added 6 new methods:
  - `disableCollege(id)` - Disables college + shows confirmation
  - `enableCollege(id)` - Enables college + shows confirmation
  - `disableDepartment(id)` - Disables department + shows confirmation
  - `enableDepartment(id)` - Enables department + shows confirmation
  - `disableBatch(id)` - Disables batch + shows confirmation
  - `enableBatch(id)` - Enables batch + shows confirmation

---

## How to Use

### Disable a College (All Children Disabled)

1. Go to Admin Panel → Colleges tab
2. Find college in table
3. Click yellow **"Disable"** button
4. Confirm message: "Disable college? All departments, batches, and students will be disabled..."
5. ✅ Disabled
   - College: `is_disabled = true`
   - All departments: `is_disabled = true`
   - All batches: `is_disabled = true`
   - All students: `is_disabled = true`
   - All users cannot login

### Disable a Department (All Batches & Students in Dept Disabled)

1. Go to Admin Panel → Departments tab
2. Find department in table
3. Click yellow **"Disable"** button
4. Confirm message: "Disable department? All batches and students will be disabled..."
5. ✅ Disabled
   - Department: `is_disabled = true`
   - All batches in dept: `is_disabled = true`
   - All students in batches: `is_disabled = true`
   - All affected users cannot login
   - Other departments unaffected

### Disable a Batch (All Students in Batch Disabled)

1. Go to Admin Panel → Batches tab
2. Find batch in table
3. Click yellow **"Disable"** button
4. Confirm message: "Disable batch? All students will be disabled..."
5. ✅ Disabled
   - Batch: `is_disabled = true`
   - All students in batch: `is_disabled = true`
   - All affected users cannot login
   - Other batches unaffected

### Enable (Reverse Any Cascade)

1. Find disabled entity (green **"Enable"** button)
2. Click **"Enable"**
3. Confirm: "Enable [entity]? All related entities will be enabled."
4. ✅ Enabled
   - Entity and all children: `is_disabled = false`
   - All re-enabled users can login again

---

## Cascade Matrix

### What Gets Disabled

| Action | College | Dept | Batch | Students |
|--------|---------|------|-------|----------|
| **Disable College** | ✅ | ✅ | ✅ | ✅ |
| **Disable Dept** | ❌ | ✅ | ✅ | ✅ |
| **Disable Batch** | ❌ | ❌ | ✅ | ✅ |
| **Disable Student** | ❌ | ❌ | ❌ | ✅ |

---

## Login Prevention

When disabled, user tries to login:
```
Login screen → Enter credentials → API checks is_disabled
→ ❌ ERROR: "Your account has been disabled"
→ Cannot access platform
```

**Verification levels:**
1. Student is_disabled?
2. Batch is_disabled?
3. Department is_disabled?
4. College is_disabled?

If **ANY** is true → login blocked

---

## Backend Cascade Logic

### Disable College Flow

```python
def disable_college_cascade(college_id):
    # 1. Disable college
    college = CollegeModel().get(college_id)
    CollegeModel().delete(college_id)  # Sets is_disabled = true
    disable_user_firebase(college.firebase_uid)
    
    # 2. For each department in college
    for dept in DepartmentModel().query(college_id=college_id):
        DepartmentModel().delete(dept["id"])
        disable_user_firebase(dept.firebase_uid)
        
        # 3. For each batch in department
        for batch in BatchModel().query(department_id=dept["id"]):
            BatchModel().delete(batch["id"])
            disable_user_firebase(batch.firebase_uid)
            
            # 4. For each student in batch
            for student in StudentModel().query(batch_id=batch["id"]):
                StudentModel().delete(student["id"])
                disable_user_firebase(student.firebase_uid)
```

---

## Frontend Button Display

**Colleges Table Example:**

**Before Disable:**
```
┌─────────────┬──────────┬─────────────┬──────────────────────────────┐
│ Name        │ Email    │ Status      │ Actions                      │
├─────────────┼──────────┼─────────────┼──────────────────────────────┤
│ IIT Delhi   │ iit@...  │ ✅ Enabled  │ Edit | [Disable] | Delete    │
└─────────────┴──────────┴─────────────┴──────────────────────────────┘
```

**After Disable:**
```
┌─────────────┬──────────┬─────────────┬──────────────────────────────┐
│ Name        │ Email    │ Status      │ Actions                      │
├─────────────┼──────────┼─────────────┼──────────────────────────────┤
│ IIT Delhi   │ iit@...  │ ⛔ Disabled │ Edit | [Enable] | Delete     │
└─────────────┴──────────┴─────────────┴──────────────────────────────┘
```

Button colors:
- **Edit** = Blue (secondary)
- **Disable** = Yellow (warning) - only for enabled
- **Enable** = Green (success) - only for disabled
- **Delete** = Red (danger)

---

## Error Messages

**Success Messages:**
- "College and all related departments, batches, and students disabled"
- "Department and all related batches and students disabled"
- "Batch and all related students disabled"

**Error Messages:**
- "College not found" (404)
- "Department not found" (404)
- "Batch not found" (404)
- "Disable failed: [error details]"
- "Enable failed: [error details]"

---

## Confirmation Dialogs

### College Disable
```
"Disable this college? All departments, batches, and students 
will be disabled and cannot login."
```

### Department Disable
```
"Disable this department? All batches and students will be 
disabled and cannot login."
```

### Batch Disable
```
"Disable this batch? All students in this batch will be 
disabled and cannot login."
```

### All Enable Dialogs
```
"Enable this [entity]? All related entities will be enabled."
```

---

## Important Notes

⚠️ **Soft Delete** - Data is NOT deleted, only marked disabled
- Can re-enable anytime
- All history preserved
- No permanent data loss

⚠️ **Firebase Sync** - Both Firestore and Firebase auth are updated
- Local: `is_disabled = true/false`
- Firebase: User disabled/enabled
- Both must be in sync for login prevention

⚠️ **Audit Trail** - All cascade actions logged
- Action: `disable_college_cascade` / `enable_college_cascade`
- Entity: college/department/batch
- Admin ID: who performed action
- Timestamp: when performed

⚠️ **Cascading Behavior** - ONLY cascades downward
- Disable college → disables children (depts, batches, students)
- Disable dept → disables children (batches, students)
- Disable batch → disables children (students only)
- Does NOT disable siblings or parents

---

## Testing Checklist

- [ ] Disable College → All children disabled
- [ ] Try login as student in disabled college → "account disabled"
- [ ] Enable College → All children enabled
- [ ] Try login as student in enabled college → Success
- [ ] Disable Department → Only dept children disabled, college unaffected
- [ ] Disable Batch → Only batch students disabled, dept unaffected
- [ ] UI buttons show correct state (Disable for enabled, Enable for disabled)
- [ ] Confirmation dialogs appear with correct message
- [ ] Success messages show after disable/enable
- [ ] Audit logs capture all cascade actions
- [ ] No console errors
- [ ] Performance acceptable (should complete in <5 seconds)

---

## File Changes Summary

| File | Changes | Lines |
|------|---------|-------|
| models.py | Added 6 cascade functions | +250 |
| routes/admin.py | Updated 6 endpoints to use cascades | 6 edits |
| js/admin.js | Updated 3 render functions + added 6 methods | 3+6 edits |

**Total Changes:**
- 2 Python files modified
- 1 JavaScript file modified
- 6 new backend functions
- 6 new frontend methods
- 3 UI tables updated

---

## Quick Test Commands

**Disable college via curl:**
```bash
curl -X POST http://localhost:5000/api/admin/colleges/college-id/disable \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json"
```

**Enable college via curl:**
```bash
curl -X POST http://localhost:5000/api/admin/colleges/college-id/enable \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json"
```

---

## Support & Troubleshooting

**Q: User still can login after being disabled?**
A: Check both Firestore and Firebase auth are updated. Run disable again.

**Q: Disable button doesn't appear?**
A: Check `is_disabled` field is present. Refresh page with Ctrl+F5.

**Q: Cascade didn't disable all students?**
A: Check database queries return all children. Verify batch_id and department_id fields.

**Q: Performance is slow?**
A: Large organizations (1000+ students) may take 3-5 seconds. This is expected.

