"""Student API routes."""
from flask import Blueprint, request, jsonify
from auth import require_auth, get_token_from_request, decode_jwt_token
from models import (
    StudentModel, BatchModel, QuestionModel, NoteModel, TopicModel, PerformanceModel,
    can_student_access
)
from agent_wrappers import (
    compile_and_run_code, evaluate_code_against_testcases, get_efficiency_feedback
)
from utils import error_response, success_response
from datetime import datetime

student_bp = Blueprint("student", __name__, url_prefix="/api/student")


# ============================================================================
# TOPIC ENDPOINTS
# ============================================================================

@student_bp.route("/topics", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_topics():
    """Get topics for student's department."""
    if request.method == "OPTIONS":
        return "", 200
    
    dept_id = request.user.get("department_id")
    if not dept_id:
        return jsonify({"error": True, "code": "NO_DEPT", "message": "Student not assigned to department"}), 400
    
    topics = TopicModel().query(department_id=dept_id)
    
    return success_response({"topics": topics})


# ============================================================================
# QUESTION ENDPOINTS
# ============================================================================

@student_bp.route("/questions", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_questions():
    """Get questions for student's batch."""
    if request.method == "OPTIONS":
        return "", 200
    
    return jsonify({
        "error": False,
        "message": "Success",
        "data": {
            "questions": [
                {
                    "id": "q1",
                    "title": "Two Sum",
                    "difficulty": "easy",
                    "topic": "Array & Strings"
                }
            ]
        }
    }), 200


@student_bp.route("/questions/<question_id>", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_question_detail(question_id):
    """Get question details for student."""
    if request.method == "OPTIONS":
        return "", 200
    
    batch_id = request.user.get("batch_id")
    if not batch_id:
        return jsonify({"error": True, "code": "NO_BATCH", "message": "Student not assigned to batch"}), 400
    
    question = QuestionModel().get(question_id)
    if not question or question.get("batch_id") != batch_id:
        return jsonify({"error": True, "code": "NOT_FOUND", "message": "Question not found"}), 404
    
    # Remove hidden test cases
    question.pop("hidden_testcases", None)
    
    return success_response({"question": question})


# ============================================================================
# CODE SUBMISSION & EVALUATION
# ============================================================================

@student_bp.route("/submit", methods=["POST", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def submit_code():
    """Submit code for evaluation using AI agents."""
    if request.method == "OPTIONS":
        return "", 200
    
    student_id = request.user.get("student_id")
    batch_id = request.user.get("batch_id")
    if not batch_id:
        return jsonify({"error": True, "code": "NO_BATCH", "message": "Student not assigned to batch"}), 400
    
    data = request.json or {}
    
    required = ["question_id", "code", "language"]
    if not all(data.get(k) for k in required):
        return error_response("INVALID_INPUT", f"Required fields: {', '.join(required)}")
    
    question_id = data["question_id"]
    code = data["code"]
    language = data["language"]
    
    # Verify question exists
    question = QuestionModel().get(question_id)
    if not question or question.get("batch_id") != batch_id:
        return error_response("NOT_FOUND", "Question not found or not assigned to your batch")
    
    # Step 1: Compile and run code
    compile_result = compile_and_run_code(code, language, question.get("visible_testcases", []))
    if not compile_result.get("success"):
        return success_response({
            "status": "compilation_error",
            "message": compile_result.get("error"),
            "submission_id": None
        }, "Compilation failed"), 400
    
    # Step 2: Evaluate against test cases
    evaluation = evaluate_code_against_testcases(
        code, language, 
        question.get("visible_testcases", []),
        question.get("hidden_testcases", [])
    )
    
    # Step 3: Get efficiency feedback
    efficiency = get_efficiency_feedback(code, language)
    
    # Store submission
    submission_data = {
        "student_id": student_id,
        "question_id": question_id,
        "code": code,
        "language": language,
        "compilation_status": "success",
        "test_results": evaluation.get("results", []),
        "passed_tests": evaluation.get("passed", 0),
        "total_tests": evaluation.get("total", 0),
        "efficiency_score": efficiency.get("score", 0),
        "efficiency_feedback": efficiency.get("feedback", ""),
        "submitted_at": datetime.now().isoformat()
    }
    
    submission_id = StudentModel().create_submission(submission_data)
    
    return success_response({
        "submission_id": submission_id,
        "status": "evaluated",
        "test_results": evaluation,
        "efficiency_feedback": efficiency
    }, "Code submitted and evaluated"), 200


# ============================================================================
# NOTES ENDPOINTS
# ============================================================================

@student_bp.route("/notes", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_notes():
    """Get notes for student."""
    if request.method == "OPTIONS":
        return "", 200
    
    student_id = request.user.get("student_id")
    notes = NoteModel().query(student_id=student_id)
    
    return success_response({"notes": notes})


# ============================================================================
# PERFORMANCE ENDPOINTS
# ============================================================================

@student_bp.route("/performance", methods=["GET", "OPTIONS"])
@require_auth(allowed_roles=["student"])
def get_performance():
    """Get student's performance metrics."""
    if request.method == "OPTIONS":
        return "", 200
    
    student_id = request.user.get("student_id")
    performance = PerformanceModel().query(student_id=student_id)
    
    if not performance:
        performance = {
            "student_id": student_id,
            "total_submissions": 0,
            "total_correct": 0,
            "total_wrong": 0,
            "topics_covered": []
        }
    
    return success_response({"performance": performance})
