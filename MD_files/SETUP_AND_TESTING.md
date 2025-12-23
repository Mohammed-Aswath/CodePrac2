# CODEPRAC 2.0 - Quick Setup & Testing Guide

## ✅ Tasks Completed

### 1. CORS Error Fixed ✓

- Updated `app.py` to allow requests from `localhost` and `file://` origins
- Added `OPTIONS` method to CORS configuration
- Allows requests from HTML file opened directly or via localhost

### 2. Seed Data Created ✓

Successfully populated Firestore with:

- **5 Test Users** (1 admin, 1 college admin, 1 dept head, 2 students)
- **2 Colleges**
- **3 Departments**
- **2 Batches**
- **5 Topics**
- **5 Sample Questions** with difficulty levels and test cases

---

## 🧪 Test User Credentials

Use these credentials to login and test the application:

### Admin Account

```
Email: admin@codeprac.com
Password: Admin@123456
Role: Super Admin
```

### College Admin Account

```
Email: college@codeprac.com
Password: College@123456
Role: College Admin
```

### Department Head Account

```
Email: dept@codeprac.com
Password: Department@123456
Role: Department Admin
```

### Student Accounts

```
Email: student1@codeprac.com
Password: Student@123456
Role: Student

Email: student2@codeprac.com
Password: Student@123456
Role: Student
```

---

## 🚀 How to Run the Application

### 1. Make sure Flask backend is running:

```bash
cd d:\PRJJ
python app.py
```

Should see: `Running on http://127.0.0.1:5000`

### 2. Open the HTML interface:

- **Option A**: Open directly in browser: Open `d:\PRJJ\index.html` in your browser
- **Option B**: Via localhost: `http://localhost:5000/` (currently shows endpoint info)

### 3. Login with test credentials

- Use any of the credentials above to login
- You'll be redirected to the appropriate dashboard based on your role

---

## 📊 Sample Questions Available

All questions have multiple test cases:

1. **Two Sum** (Easy) - Array & Strings

   - Find two numbers that sum to target
   - Test cases included

2. **Reverse String** (Easy) - Array & Strings

   - Reverse a string in-place
   - Test cases included

3. **Merge Sorted Array** (Easy) - Sorting & Searching

   - Merge two sorted arrays
   - Test cases included

4. **Valid Parentheses** (Medium) - Array & Strings

   - Check if brackets are valid
   - Test cases included

5. **Binary Search** (Medium) - Sorting & Searching
   - O(log n) search in sorted array
   - Test cases included

---

## 🛠 Backend API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/password-reset-request` - Request password reset
- `POST /api/auth/verify-token` - Verify JWT token

### Admin (Super Admin only)

- `GET/POST /api/admin/colleges` - Manage colleges
- `GET/POST /api/admin/departments` - Manage departments
- `GET/POST /api/admin/batches` - Manage batches
- `GET/POST /api/admin/students` - Manage students
- `GET/POST /api/admin/questions` - Manage questions

### College

- `GET /api/college/departments` - View departments
- `POST /api/college/departments` - Create department
- `GET /api/college/performance` - View performance

### Department

- `GET /api/department/topics` - View topics
- `POST /api/department/topics` - Create topic
- `GET /api/department/questions` - View questions
- `POST /api/department/questions` - Create question
- `GET /api/department/batches` - View batches
- `POST /api/department/students/upload-csv` - Upload students

### Student

- `GET /api/student/questions` - View available questions
- `GET /api/student/performance` - View performance history
- `POST /api/student/submit` - Submit code solution
- `GET /api/student/notes` - View notes

---

## 📁 Project Structure

```
d:\PRJJ\
├── app.py                 # Flask app main entry
├── config.py              # Configuration
├── auth.py                # Authentication logic
├── firebase_init.py       # Firebase initialization
├── models.py              # Firestore models
├── agent_wrappers.py      # AI agent integration
├── utils.py               # Utility functions
├── requirements.txt       # Python dependencies
├── seed_data.py           # Seed script (just run)
├── index.html             # Frontend UI
├── firebase-key.json      # Firebase credentials
├── routes/
│   ├── auth.py           # Auth endpoints
│   ├── admin.py          # Admin endpoints
│   ├── college.py        # College endpoints
│   ├── department.py     # Department endpoints
│   └── student.py        # Student endpoints
└── agents/               # AI agents (external)
    ├── compiler_agent.py
    ├── evaluator_agent.py
    ├── efficiency_agent.py
    └── testcase_agent.py
```

---

## 🐛 Troubleshooting

### CORS Errors

✅ **Fixed** - Now allows `localhost`, `127.0.0.1`, and `file://` origins

### Firebase Errors

- Make sure `firebase-key.json` is in `d:\PRJJ\`
- Check that Firebase credentials are valid

### Port Already in Use

```bash
# If port 5000 is already in use, kill the process:
Stop-Process -Name python -Force
```

### Import Errors

- All imports have been fixed
- Make sure to install: `pip install -r requirements.txt`

---

## 📝 What's Next?

After testing with seed data:

1. **Test Login**: Try all 5 test users
2. **Student Practice**: Submit code solutions to get AI feedback
3. **Admin Management**: Create/edit colleges, departments, etc.
4. **Monitor**: Check console for AI agent responses and database operations

---

## 💡 Features Available

- ✅ Multi-role authentication (Admin, College, Dept, Student)
- ✅ Firestore database integration
- ✅ AI-powered code evaluation (via Groq API)
- ✅ Real-time execution results
- ✅ Efficiency analysis
- ✅ Role-based access control
- ✅ CORS enabled for local development
- ✅ Sample data with 5 practice questions

**Happy coding! 🎉**
