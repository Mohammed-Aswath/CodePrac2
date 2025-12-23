"""Evaluator agent checks correctness across all testcases."""
import json
import logging
from .groq_client import GroqClient

logger = logging.getLogger(__name__)


def evaluate_submission(question_description, testcases, code, language):
    """
    Evaluate code using LLM reasoning over testcases.
    Returns {"is_correct": bool, "reason": str}.
    """
    if not testcases:
        logger.error("No test cases provided for evaluation")
        return {
            "is_correct": False,
            "reason": "No test cases available for evaluation"
        }
    
    client = GroqClient()
    system = (
        "You are an impartial code evaluator. "
        "Given a problem, testcases, and code, decide if outputs match all cases "
        "and if the solution avoids hard-coded outputs. Respond ONLY JSON "
        'with {\"is_correct\": true/false, \"reason\": \"short explanation\"}'
    )
    user = (
        f"Problem:\n{question_description}\nLanguage:{language}\n"
        f"Code:\n{code}\nTestcases:\n{json.dumps(testcases, default=str)}"
    )
    
    try:
        content = client.chat(
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            max_tokens=200,
        )
        data = json.loads(content)
        return {
            "is_correct": bool(data.get("is_correct")),
            "reason": str(data.get("reason", ""))
        }
    
    except json.JSONDecodeError as err:
        error_msg = f"Failed to parse evaluator response as JSON: {content[:100]}"
        logger.error(error_msg, exc_info=True)
        return {
            "is_correct": False,
            "reason": f"Evaluation error: {error_msg[:50]}"
        }
    
    except RuntimeError as err:
        error_msg = f"Groq API error during evaluation: {str(err)}"
        logger.error(error_msg)
        return {
            "is_correct": False,
            "reason": error_msg
        }
    
    except Exception as err:
        error_msg = f"Unexpected evaluation error: {type(err).__name__}: {str(err)}"
        logger.error(error_msg, exc_info=True)
        return {
            "is_correct": False,
            "reason": error_msg[:100]
        }

