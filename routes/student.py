"""Student API routes."""
from flask import Blueprint, request, jsonify
from auth import require_auth, get_token_from_request, decode_jwt_token
from models import (
    StudentModel, BatchModel, QuestionModel, NoteModel, TopicModel, PerformanceModel,
    CollegeModel, DepartmentModel, can_student_access
)
from topic_service import TopicService
from agent_wrappers import (
    compile_and_run_code, evaluate_code_against_testcases, get_efficiency_feedback
)
from utils import error_response, success_response
from datetime import datetime

student_bp = Blueprint("student", __name__, url_prefix="/api/student")


# ============================================================================
# PROFILE ENDPOINT
# ============================================================================

@student_bp.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "Student routes working", "status": "ok"}), 200

@student_bp.route("/profile", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_profile():
    """Get student profile with resolved names."""
    if request.method == "OPTIONS":
        return "", 200
    
    student_id = request.user.get("student_id")
    if not student_id:
        return error_response("NO_STUDENT_ID", "Student ID not found in token", status_code=400)
        
    student = StudentModel().get(student_id)
    
    # Fallback: If not found by ID, check if the ID provided is actually a firebase_uid
    if not student:
        # Try finding by firebase_uid
        results = StudentModel().query(firebase_uid=student_id)
        if results:
            student = results[0]
            
    if not student:
        print(f"DEBUG: Student not found for ID: {student_id}")
        return error_response("NOT_FOUND", "Student not found", status_code=404)
        
    # Resolve names
    college = CollegeModel().get(student.get("college_id"))
    department = DepartmentModel().get(student.get("department_id"))
    batch = BatchModel().get(student.get("batch_id"))
    
    student["college_name"] = college.get("name") if college else "Unknown College"
    student["department_name"] = department.get("name") if department else "Unknown Department"
    student["batch_name"] = batch.get("batch_name") if batch else "Unknown Batch"
    
    return success_response({"student": student})


# ============================================================================
# TOPIC ENDPOINTS
# ============================================================================

@student_bp.route("/topics", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_topics():
    """Get topics for student's batch."""
    if request.method == "OPTIONS":
        return "", 200
    
    print("🔍 GET /student/topics called")
    print(f"Request user: {request.user}")
    
    batch_id = request.user.get("batch_id")
    print(f"Batch ID from token: {batch_id}")
    
    if not batch_id:
        print("ERROR: No batch_id in token")
        return error_response("NO_BATCH", "Student not assigned to batch", status_code=400)
    
    try:
        print(f"Querying topics for batch_id: {batch_id}")
        result = TopicService.get_topics_for_batch(batch_id)
        print(f"Result: {result}")
        return result
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response("QUERY_ERROR", str(e), status_code=500)


# ============================================================================
# TEST ENDPOINT (no auth needed)
# ============================================================================

@student_bp.route("/test", methods=["GET"])
def test():
    """Test endpoint without auth."""
    return jsonify({"message": "Student blueprint is working"}), 200


# ============================================================================
# QUESTION ENDPOINTS
# ============================================================================

@student_bp.route("/questions", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_questions():
    """Get questions for student's batch (optionally filtered by topic)."""
    if request.method == "OPTIONS":
        return "", 200
    
    batch_id = request.user.get("batch_id")
    if not batch_id:
        return error_response("NO_BATCH", "Student not assigned to batch", status_code=400)
    
    # Optional: filter by topic_id
    topic_id = request.args.get("topic_id")
    
    # Query questions for student's batch
    filters = {"batch_id": batch_id}
    if topic_id:
        filters["topic_id"] = topic_id
    
    questions = QuestionModel().query(**filters)
    
    # Check attempts
    student_id = request.user.get("student_id")
    attempts = PerformanceModel().query(student_id=student_id)
    attempted_ids = {a.get("question_id") for a in attempts}
    solved_ids = {a.get("question_id") for a in attempts if a.get("status") == "correct"}
    
    # Remove hidden test cases and add flags
    for q in questions:
        q.pop("hidden_testcases", None)
        q["is_attempted"] = q.get("id") in attempted_ids
        q["is_solved"] = q.get("id") in solved_ids
    
    return success_response({"questions": questions})


@student_bp.route("/questions/<question_id>", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_question_detail(question_id):
    """Get question details for student."""
    if request.method == "OPTIONS":
        return "", 200
    
    print(f'🔍 get_question_detail called with question_id: {question_id}')
    batch_id = request.user.get("batch_id")
    if not batch_id:
        return error_response("NO_BATCH", "Student not assigned to batch", status_code=400)
    
    question = QuestionModel().get(question_id)
    print(f'🔍 Question fetched: {question}')
    if not question or question.get("batch_id") != batch_id:
        print(f'🔍 Question validation failed - question exists: {bool(question)}, batch match: {question.get("batch_id") if question else "N/A"} == {batch_id}')
        return error_response("NOT_FOUND", "Question not found", status_code=404)
    
    # Remove hidden test cases
    question.pop("hidden_testcases", None)
    
    print(f'🔍 Returning question: {question}')
    return success_response({"question": question})


@student_bp.route("/questions/by-topic/<topic_id>", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_questions_by_topic(topic_id):
    """Get questions for a specific topic (student's batch)."""
    if request.method == "OPTIONS":
        return "", 200
    
    batch_id = request.user.get("batch_id")
    if not batch_id:
        return error_response("NO_BATCH", "Student not assigned to batch", status_code=400)
    
    # Query questions for this topic and batch
    questions = QuestionModel().query(topic_id=topic_id, batch_id=batch_id)
    
    # Check attempts
    student_id = request.user.get("student_id")
    attempts = PerformanceModel().query(student_id=student_id)
    attempted_ids = {a.get("question_id") for a in attempts}
    solved_ids = {a.get("question_id") for a in attempts if a.get("status") == "correct"}
    
    # Remove hidden test cases and add flags
    for q in questions:
        q.pop("hidden_testcases", None)
        q["is_attempted"] = q.get("id") in attempted_ids
        q["is_solved"] = q.get("id") in solved_ids
    
    return success_response({"questions": questions})


# ============================================================================
# CODE SUBMISSION & EVALUATION
# ============================================================================

@student_bp.route("/run", methods=["POST", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def run_code():
    """Run code against sample test case (Compiler Agent)."""
    print(f"DEBUG: /api/student/run HIT. User: {request.user.get('student_id') if request.user else 'Unknown'}", flush=True)
    if request.method == "OPTIONS":
        return "", 200
    
    student_id = request.user.get("student_id")
    batch_id = request.user.get("batch_id")
    
    if not batch_id:
        return error_response("NO_BATCH", "Student not assigned to batch", status_code=400)
    
    data = request.json or {}
    
    required = ["question_id", "code", "language"]
    if not all(data.get(k) for k in required):
        return error_response("INVALID_INPUT", f"Required fields: {', '.join(required)}")
    
    question_id = data["question_id"]
    code = data["code"]
    language = data["language"]
    test_input = data.get("test_input", "")
    
    # Verify question belongs to student's batch
    question = QuestionModel().get(question_id)
    if not question or question.get("batch_id") != batch_id:
        return error_response("NOT_FOUND", "Question not found", status_code=404)
    
    # Compile and run code with sample input
    compile_result = compile_and_run_code(
        question.get("description"), 
        code, 
        language, 
        test_input
    )
    
    if not compile_result["success"]:
        print(f"DEBUG: compile_result (error): {compile_result}", flush=True)
        return success_response({
            "status": "error",
            "error": compile_result["error"],
            "output": None
        })
    
    return success_response({
        "status": "success",
        "output": compile_result["data"]["output"],
        "execution_time": compile_result["data"]["execution_time"]
    })


@student_bp.route("/efficiency", methods=["POST", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_code_efficiency():
    """Analyze efficiency of correct solution (Efficiency Agent)."""
    if request.method == "OPTIONS":
        return "", 200
    
    student_id = request.user.get("student_id")
    batch_id = request.user.get("batch_id")
    
    if not batch_id:
        return error_response("NO_BATCH", "Student not assigned to batch", status_code=400)
    
    data = request.json or {}
    
    required = ["question_id", "code", "language"]
    if not all(data.get(k) for k in required):
        return error_response("INVALID_INPUT", f"Required fields: {', '.join(required)}")
    
    question_id = data["question_id"]
    code = data["code"]
    language = data["language"]
    
    # Verify question belongs to student's batch
    question = QuestionModel().get(question_id)
    if not question or question.get("batch_id") != batch_id:
        return error_response("NOT_FOUND", "Question not found", status_code=404)
    
    # Analyze efficiency
    eff_result = get_efficiency_feedback(question.get("description"), code)
    
    if not eff_result["success"]:
        return error_response("ANALYSIS_FAILED", eff_result["error"], status_code=500)
    
    return success_response(eff_result["data"])

@student_bp.route("/submit", methods=["POST", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def submit_code():
    """Submit code for evaluation using AI agents."""
    if request.method == "OPTIONS":
        return "", 200
    
    student_id = request.user.get("student_id")
    batch_id = request.user.get("batch_id")
    department_id = request.user.get("department_id")
    college_id = request.user.get("college_id")
    
    if not batch_id:
        return error_response("NO_BATCH", "Student not assigned to batch", status_code=400)
    
    data = request.json or {}
    
    required = ["question_id", "code", "language"]
    if not all(data.get(k) for k in required):
        return error_response("INVALID_INPUT", f"Required fields: {', '.join(required)}")
    
    question_id = data["question_id"]
    code = data["code"]
    language = data["language"]
    
    # Verify question belongs to student's batch
    question = QuestionModel().get(question_id)
    if not question or question.get("batch_id") != batch_id:
        return error_response("NOT_FOUND", "Question not found", status_code=404)
    
    # Step 1: Compile and run code on sample input
    compile_result = compile_and_run_code(
        question.get("description"), 
        code, 
        language, 
        question.get("sample_input")
    )
    
    if not compile_result["success"]:
        # Store failed submission
        perf_data = {
            "student_id": student_id,
            "question_id": question_id,
            "batch_id": batch_id,
            "department_id": department_id,
            "college_id": college_id,
            "status": "execution_error",
            "submission_code": code,
            "submission_language": language,
            "test_results": {"total": 0, "passed": 0, "failed": 0},
            "submitted_at": datetime.utcnow(),
            "attempts": 1
        }
        
        perf_id = PerformanceModel().create(perf_data)
        
        return success_response({
            "status": "execution_error",
            "error": compile_result["error"],
            "performance_id": perf_id
        }), 200
    
    # Step 2: Evaluate against all test cases
    all_testcases = (
        question.get("open_testcases", []) +
        question.get("hidden_testcases", [])
    )
    
    eval_result = evaluate_code_against_testcases(
        question.get("description"), 
        code, 
        language, 
        all_testcases
    )
    
    is_correct = False
    eval_reason = "Evaluation failed"
    
    if eval_result["success"]:
        is_correct = eval_result["data"]["is_correct"]
        eval_reason = eval_result["data"]["reason"]
    else:
        eval_reason = eval_result.get("error", "Evaluation failed")
    
    # Step 3: If correct, get efficiency feedback
    efficiency_feedback = None
    if is_correct:
        eff_result = get_efficiency_feedback(question.get("description"), code)
        if eff_result["success"]:
            efficiency_feedback = eff_result["data"]
    
    # Store performance record
    perf_data = {
        "student_id": student_id,
        "question_id": question_id,
        "batch_id": batch_id,
        "department_id": department_id,
        "college_id": college_id,
        "status": "correct" if is_correct else "incorrect",
        "submission_code": code,
        "submission_language": language,
        "test_results": {
            "is_correct": is_correct,
            "reason": eval_reason
        },
        "efficiency_feedback": efficiency_feedback if efficiency_feedback else None,
        "submitted_at": datetime.utcnow(),
        "attempts": 1
    }
    
    perf_id = PerformanceModel().create(perf_data)
    
    response_data = {
        "status": "correct" if is_correct else "incorrect",
        "test_results": perf_data["test_results"],
        "performance_id": perf_id
    }
    
    if efficiency_feedback:
        response_data["efficiency_feedback"] = efficiency_feedback
    
    return success_response(response_data)


# ============================================================================
# NOTES ENDPOINTS
# ============================================================================

@student_bp.route("/notes", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_notes():
    """Get notes for student's batch."""
    if request.method == "OPTIONS":
        return "", 200
    
    batch_id = request.user.get("batch_id")
    department_id = request.user.get("department_id")
    
    if not batch_id:
        return error_response("NO_BATCH", "Student not assigned to batch", status_code=400)
    
    # Query notes for this batch
    filters = {"batch_id": batch_id}
    
    notes = NoteModel().query(**filters)
    
    return success_response({"notes": notes})


# ============================================================================
# PERFORMANCE HISTORY
# ============================================================================

@student_bp.route("/performance", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_performance():
    """Get submission history for student."""
    if request.method == "OPTIONS":
        return "", 200
    
    student_id = request.user.get("student_id")
    question_id = request.args.get("question_id")
    
    filters = {"student_id": student_id}
    if question_id:
        filters["question_id"] = question_id
    
    performance = PerformanceModel().query(**filters)
    
    # Enriched performance data with question details
    for p in performance:
        q = QuestionModel().get(p.get("question_id"))
        p["question_title"] = q.get("title") if q else "Unknown Question"
        p["question_difficulty"] = q.get("difficulty") if q else "Medium"
    
    # Sort by submission time (descending)
    performance.sort(key=lambda x: x.get("submitted_at"), reverse=True)
    
    return success_response({"performance": performance})
