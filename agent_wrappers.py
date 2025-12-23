"""AI Agent integration wrapper functions."""
import logging
from agents.compiler_agent import run_code_with_agent
from agents.evaluator_agent import evaluate_submission
from agents.efficiency_agent import analyze_efficiency
from agents.testcase_agent import generate_testcases_for_question
from config import MAX_CODE_SIZE_KB

logger = logging.getLogger(__name__)


def generate_hidden_testcases(description, sample_input, sample_output):
    """Wrapper to generate hidden test cases for a question.
    
    Args:
        description: Problem description
        sample_input: Sample input
        sample_output: Sample output
    
    Returns:
        {
            "success": bool,
            "error": str or None,
            "testcases": list of {"input": str, "expected_output": str}
        }
    """
    try:
        if not description or not sample_input or not sample_output:
            error_msg = "Missing required fields: description, sample_input, sample_output"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "testcases": []
            }
        
        testcases = generate_testcases_for_question(description, sample_input, sample_output)
        
        if not isinstance(testcases, list):
            logger.error(f"Invalid testcase return type: {type(testcases)}")
            return {
                "success": False,
                "error": "Invalid test case generation result",
                "testcases": []
            }
        
        if not testcases:
            logger.warning("No test cases generated")
            return {
                "success": False,
                "error": "Failed to generate test cases",
                "testcases": []
            }
        
        logger.info(f"Successfully generated {len(testcases)} test cases")
        return {
            "success": True,
            "error": None,
            "testcases": testcases
        }
    
    except Exception as e:
        error_msg = f"Testcase generation error: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "success": False,
            "error": error_msg[:100],
            "testcases": []
        }


def compile_and_run_code(question_description, code, language, test_input=None):
    """Wrapper to compile and run code.
    
    Args:
        question_description: Problem description for context
        code: Source code
        language: Programming language (python, cpp, java, javascript)
        test_input: Input to run code with (optional)
    
    Returns:
        {
            "success": bool,
            "error": str or None,
            "data": {
                "output": str,
                "execution_time": float
            }
        }
    """
    try:
        # Validate inputs
        if not code or not code.strip():
            return {
                "success": False,
                "error": "Code cannot be empty",
                "data": None
            }
        
        if not language:
            return {
                "success": False,
                "error": "Language must be specified",
                "data": None
            }
        
        # Validate code size
        if len(code) > MAX_CODE_SIZE_KB * 1024:
            error_msg = f"Code exceeds {MAX_CODE_SIZE_KB}KB limit"
            return {
                "success": False,
                "error": error_msg,
                "data": None
            }
        
        result = run_code_with_agent(question_description, code, language, test_input)
        
        if "error" in result:
            return {
                "success": False,
                "error": result["error"],
                "data": None
            }
        
        return {
            "success": True,
            "error": None,
            "data": {
                "output": result.get("output", ""),
                "execution_time": 0.0  # Could add actual timing in future
            }
        }
    
    except Exception as e:
        error_msg = f"Code compilation error: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "success": False,
            "error": error_msg[:100],
            "data": None
        }


def evaluate_code_against_testcases(question_description, code, language, testcases):
    """Wrapper to evaluate code against test cases.
    
    Args:
        question_description: Problem description
        code: Source code
        language: Programming language
        testcases: List of [{"input": str, "expected_output": str}, ...]
    
    Returns:
        {
            "success": bool,
            "error": str or None,
            "data": {
                "is_correct": bool,
                "reason": str,
                "test_results": list
            }
        }
    """
    try:
        if not testcases:
            return {
                "success": False,
                "error": "No test cases provided",
                "data": None
            }
        
        result = evaluate_submission(question_description, testcases, code, language)
        
        return {
            "success": True,
            "error": None,
            "data": {
                "is_correct": result.get("is_correct", False),
                "reason": result.get("reason", ""),
                "test_results": []
            }
        }
    
    except Exception as e:
        error_msg = f"Code evaluation error: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "success": False,
            "error": error_msg[:100],
            "data": None
        }


def get_efficiency_feedback(problem_description, code):
    """Wrapper to get efficiency feedback.
    
    Args:
        problem_description: Problem description for context
        code: Source code
    
    Returns:
        {
            "success": bool,
            "error": str or None,
            "data": {
                "time_complexity": str,
                "space_complexity": str,
                "approach_summary": str,
                "improvement_suggestions": str,
                "optimal_method": str
            }
        }
    """
    try:
        if not code or not code.strip():
            return {
                "success": False,
                "error": "Code cannot be empty",
                "data": None
            }
        
        feedback = analyze_efficiency(problem_description, code)
        
        return {
            "success": True,
            "error": None,
            "data": feedback
        }
    
    except Exception as e:
        error_msg = f"Efficiency analysis error: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "success": False,
            "error": error_msg[:100],
            "data": None
        }
