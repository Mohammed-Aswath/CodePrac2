"""
FRONTEND AI AGENTS INTEGRATION - IMPLEMENTATION GUIDE
=====================================================

Date: December 23, 2025
Project: CODEPRAC 2.0
Status: COMPLETE AND READY FOR TESTING
"""

# ============================================================================
# OVERVIEW
# ============================================================================

The frontend has been integrated with AI agents to provide students and batch
admins with intelligent code evaluation and test case generation features.

## Two Main Features

### 1. STUDENT CODE EDITOR (Compiler + Evaluator + Efficiency)
**File**: js/student.js
**Agents Used**:
  - Compiler Agent: Run code on sample input
  - Evaluator Agent: Check against all test cases
  - Efficiency Agent: Analyze time/space complexity

### 2. BATCH ADMIN TEST CASE GENERATOR
**File**: js/batch-testcase-generator.js
**Agent Used**:
  - Test Case Generator Agent: Create hidden test cases

---

# ============================================================================
# STUDENT CODE EDITOR INTEGRATION
# ============================================================================

## Three Operations

### 1. RUN CODE (Compiler Agent)
Endpoint: POST /api/student/run
Purpose: Execute code on sample test case

**Request**:
```javascript
{
    "question_id": "q-001",
    "code": "def solve():\n    pass",
    "language": "python",
    "test_input": "5 3"
}
```

**Response**:
```javascript
{
    "error": false,
    "data": {
        "status": "success",
        "output": "8\n",
        "execution_time": 0.12
    }
}
```

**Frontend Implementation** (student.js):
```javascript
async runCode() {
    // Get code from editor
    const code = document.getElementById('codeEditor').value;
    
    // Send to /student/run endpoint
    const response = await fetch(`${CONFIG.API_BASE_URL}/student/run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            question_id: this.selectedQuestion.id,
            code: code,
            language: this.currentLanguage,
            test_input: this.selectedQuestion.sample_input
        })
    });
    
    // Display results
    this.results = response.data;
    this.renderResults();
}
```

### 2. SUBMIT CODE (Evaluator + Efficiency Agents)
Endpoint: POST /api/student/submit
Purpose: Full evaluation against all test cases

**Request**:
```javascript
{
    "question_id": "q-001",
    "code": "def solve():\n    a, b = map(int, input().split())\n    print(a + b)",
    "language": "python"
}
```

**Response (Correct)**:
```javascript
{
    "error": false,
    "data": {
        "status": "correct",
        "test_results": {
            "is_correct": true,
            "reason": "All tests passed"
        },
        "efficiency_feedback": {
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "approach_summary": "Direct computation",
            "improvement_suggestions": "Already optimal",
            "optimal_method": "No further optimization needed"
        }
    }
}
```

**Frontend Implementation** (student.js):
```javascript
async submitCode() {
    const code = document.getElementById('codeEditor').value;
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/student/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            question_id: this.selectedQuestion.id,
            code: code,
            language: this.currentLanguage
        })
    });
    
    this.results = response.data;
    
    if (this.results.status === 'correct') {
        // Show efficiency feedback
        this.renderResults();
    }
}
```

### 3. ANALYZE EFFICIENCY (Efficiency Agent)
Endpoint: POST /api/student/efficiency
Purpose: Deep-dive analysis of correct solution

**Request**:
```javascript
{
    "question_id": "q-001",
    "code": "def solve():\n    a, b = map(int, input().split())\n    print(a + b)",
    "language": "python"
}
```

**Response**:
```javascript
{
    "error": false,
    "data": {
        "time_complexity": "O(1)",
        "space_complexity": "O(1)",
        "approach_summary": "Reads two numbers and prints their sum",
        "improvement_suggestions": "Already using optimal approach",
        "optimal_method": "Direct computation is optimal for this problem"
    }
}
```

---

# ============================================================================
# BATCH ADMIN TEST CASE GENERATION
# ============================================================================

## Operation: Generate Test Cases
Endpoint: POST /api/batch/generate-testcases
Purpose: Generate 5 diverse test cases for a question

**Request**:
```javascript
{
    "question_id": "q-001",
    "description": "Write a function that takes two numbers and returns their sum",
    "sample_input": "5 3",
    "sample_output": "8"
}
```

**Response**:
```javascript
{
    "error": false,
    "data": {
        "testcases": [
            {"input": "0 0", "expected_output": "0"},
            {"input": "100 200", "expected_output": "300"},
            {"input": "-5 3", "expected_output": "-2"},
            {"input": "1000000 1000000", "expected_output": "2000000"},
            {"input": "1 -1", "expected_output": "0"}
        ],
        "count": 5
    }
}
```

**Frontend Implementation** (batch-testcase-generator.js):
```javascript
async generateTestCases() {
    const response = await fetch(`${CONFIG.API_BASE_URL}/batch/generate-testcases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            question_id: this.selectedQuestion.id,
            description: this.selectedQuestion.description,
            sample_input: this.selectedQuestion.sample_input,
            sample_output: this.selectedQuestion.sample_output
        })
    });
    
    const data = response.data;
    this.displayTestCases(data.testcases);
}
```

---

# ============================================================================
# STUDENT.JS IMPLEMENTATION DETAILS
# ============================================================================

## Updated Functions

### renderResults()
Displays results in a dark terminal-style interface matching prototype.

**Features**:
- Status indicator (Correct/Incorrect/Error)
- Code output display
- Test results breakdown
- Efficiency feedback with:
  - Time complexity
  - Space complexity
  - Approach summary
  - Improvement suggestions
  - Optimal method

**Styling**:
```javascript
// Dark terminal theme (no emojis)
background: #1e1e1e;
color: #fff;
Status: Green for Correct, Red for Error, Yellow for Partial
```

### runCode()
- Sends code + sample input to /api/student/run
- Shows live output from execution
- No submission stored (just testing)

### submitCode()
- Sends code to /api/student/submit
- Evaluates against ALL test cases (sample + hidden)
- If correct: Calls analyzeEfficiency()
- If incorrect: Shows which tests failed

### analyzeEfficiency()
- Only callable if solution is correct
- Calls /api/student/efficiency
- Displays complexity analysis and suggestions

---

# ============================================================================
# ERROR HANDLING
# ============================================================================

## Frontend Error Handling

All errors from backend are captured and displayed to user:

```javascript
if (!response.ok) {
    throw new Error(data.message || 'Operation failed');
}

// Display to user
Utils.showMessage('practiceMessage', 'Error: ' + error.message, 'error');
```

## Common Errors

### 1. API Key Not Configured
**Error Message**: "GROQ_API_KEY not configured"
**Fix**: Set GROQ_API_KEY in .env file (already done)

### 2. Code Execution Timeout
**Error Message**: "Code execution timed out (5s limit)"
**Cause**: Code takes too long to run
**Solution**: Optimize code

### 3. Language Not Supported
**Error Message**: "Unsupported language: xyz"
**Supported**: python, javascript, java, cpp

### 4. Missing Required Fields
**Error Message**: "Missing required fields: code, language"
**Fix**: Ensure all fields in request are filled

---

# ============================================================================
# UI/UX FEATURES
# ============================================================================

## Student Code Editor Layout

### Phase 1: Topic Selection
- Left panel: Topics list
- Selected topic highlighted
- Click to load questions

### Phase 2: Question Selection
- Left panel: Topics
- Middle panel: Questions list
- Selected question highlighted
- Click to open editor

### Phase 3: Code Editor
- Left: Problem statement + sample input/output
- Top Right: Code editor with language selector
- Bottom Right: Test output/results

### Buttons
- Run: Execute on sample input
- Submit: Full evaluation
- Analyze Efficiency: Deep analysis (if correct)

## Batch Test Case Generator UI

### Layout
- Question selector (left)
- Selected question details (center)
- Generated test cases (right)
- Generate button

### Steps
1. Select question
2. Click "Generate Test Cases"
3. View generated test cases
4. Save to database

---

# ============================================================================
# STATE MANAGEMENT
# ============================================================================

## StudentPractice Object State

```javascript
{
    topics: [],                    // All topics
    selectedTopic: {...},          // Currently selected
    questions: [],                 // Questions in topic
    selectedQuestion: {...},       // Currently selected
    notes: [],                     // Batch notes
    currentLanguage: 'python',     // Selected language
    code: '',                      // Current code
    results: {                     // Latest results
        type: 'run'|'submit',
        status: 'success'|'error'|'correct'|'incorrect',
        output: '',
        error: null,
        efficiency_feedback: {...}
    },
    currentPhase: 'topics'|'questions'|'editor'
}
```

## BatchTestCaseGenerator Object State

```javascript
{
    questions: [],                 // All batch questions
    selectedQuestion: {...},       // Currently selected
    generatingTestCases: false     // Loading state
}
```

---

# ============================================================================
# REQUEST/RESPONSE FLOW
# ============================================================================

## Flow 1: Run Code

```
Student writes code
    ↓
Clicks "Run" button
    ↓
Frontend sends: POST /student/run
    {
        question_id,
        code,
        language,
        test_input (sample input)
    }
    ↓
Backend receives request
    ↓
Validates question access
    ↓
Calls: compile_and_run_code()
    ↓
Groq API executes code
    ↓
Returns: {output, error, execution_time}
    ↓
Frontend displays output in results panel
    ↓
Student reviews and iterates
```

## Flow 2: Submit Code

```
Student clicks "Submit"
    ↓
Frontend sends: POST /student/submit
    {
        question_id,
        code,
        language
        (no test_input - uses all test cases)
    }
    ↓
Backend validates question access
    ↓
Calls: evaluate_code_against_testcases()
    ↓
Groq API evaluates against all tests
    ↓
If correct: Calls get_efficiency_feedback()
    ↓
Groq API analyzes complexity
    ↓
Returns: {is_correct, test_results, efficiency_feedback}
    ↓
Frontend displays status + complexity analysis
    ↓
Student sees "Correct" or "Incorrect"
```

## Flow 3: Generate Test Cases

```
Batch admin selects question
    ↓
Clicks "Generate Test Cases"
    ↓
Frontend sends: POST /batch/generate-testcases
    {
        question_id,
        description,
        sample_input,
        sample_output
    }
    ↓
Backend validates batch access
    ↓
Calls: generate_hidden_testcases()
    ↓
Groq API generates diverse test cases
    ↓
Returns: [
        {input: "...", expected_output: "..."},
        ...5 test cases...
    ]
    ↓
Frontend displays generated test cases
    ↓
Admin can save or regenerate
```

---

# ============================================================================
# TESTING CHECKLIST
# ============================================================================

## Student Testing

- [ ] Load student page
- [ ] Select topic
- [ ] Select question
- [ ] Write code
- [ ] Click "Run" - should show output
- [ ] Click "Submit" - should show status
- [ ] If correct, "Analyze Efficiency" becomes available
- [ ] Click "Analyze Efficiency" - should show complexity
- [ ] Try incorrect code - should fail submission
- [ ] Try timing out code - should show timeout error

## Batch Admin Testing

- [ ] Load batch page
- [ ] Navigate to test case generator tab
- [ ] Select question
- [ ] Click "Generate Test Cases"
- [ ] View generated test cases
- [ ] Verify 5 diverse test cases were created
- [ ] Try with invalid question - should error
- [ ] Try with missing fields - should error

## Error Cases

- [ ] API key missing - should show clear error
- [ ] Code execution timeout - should handle gracefully
- [ ] Network error - should display error message
- [ ] Invalid JSON response - should handle gracefully
- [ ] Missing required fields - should validate

---

# ============================================================================
# CONFIGURATION
# ============================================================================



## Frontend Config (js/config.js)

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    // ... other config
};
```

Adjust API_BASE_URL if backend is on different host/port.

---

# ============================================================================
# DEPLOYMENT CHECKLIST
# ============================================================================

- [ ] Run test_agents_integration.py (backend tests)
- [ ] Test all three student code operations
- [ ] Test batch test case generation
- [ ] Verify error messages display correctly
- [ ] Check dark theme rendering (no emojis)
- [ ] Test with network latency simulation
- [ ] Verify button states (disabled during processing)
- [ ] Test with various code examples
- [ ] Check response times are acceptable
- [ ] Review browser console for errors

---

# ============================================================================
# FILES MODIFIED/CREATED
# ============================================================================

**Frontend**:
✓ js/student.js - Enhanced with agent integration
✓ js/batch-testcase-generator.js - New file for test case generation
✓ index.html - Added script reference

**Backend**:
✓ routes/student.py - Added /run and /efficiency endpoints
✓ routes/batch.py - Added /generate-testcases endpoint
✓ agent_wrappers.py - Standardized returns
✓ agents/*.py - Fixed error handling

---

# ============================================================================
# NEXT STEPS
# ============================================================================

1. **Test the Student Editor**:
   - Load practice page
   - Write a simple solution
   - Test Run, Submit, Analyze flows

2. **Test Batch Admin Features**:
   - Generate test cases for a question
   - Verify quality of generated test cases

3. **Monitor Performance**:
   - Note API response times
   - Check for any timeout issues
   - Validate error recovery

4. **Gather User Feedback**:
   - Test with real students
   - Collect feedback on UX
   - Adjust as needed

5. **Production Deployment**:
   - Update API_BASE_URL in config.js
   - Ensure all .env variables set
   - Monitor Groq API usage
   - Set up error logging

---

Generated: December 23, 2025
Status: READY FOR TESTING
