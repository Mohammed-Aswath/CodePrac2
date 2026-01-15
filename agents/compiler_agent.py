"""LLM-based pseudo compiler agent (documented placeholder)."""
import json
import re
import logging
import shutil
from .groq_client import GroqClient

logger = logging.getLogger(__name__)


def check_language_support(language):
    """Check if language tools are available.
    
    Returns:
        (bool, str or None): (supported, error_message)
    """
    valid_languages = ['python', 'cpp', 'java', 'javascript', 'c']
    
    if language.lower() not in valid_languages:
        return False, f"Unsupported language: {language}. Supported: {', '.join(valid_languages)}"
    
    # Validation skipped: we rely on LLM simulation now.
    return True, None


def run_code_with_agent(question_description, code, language, test_input=None):
    """
    Simulate code execution via LLM. In production, replace with sandboxed runner (e.g., Judge0).
    Returns dict with either {"output": "..."} or {"error": "..."}.
    """
    print(f"DEBUG: run_code_with_agent called with language={language}", flush=True)
    print(f"DEBUG: Code being run (first 50 chars): {code[:50] if code else 'None'}", flush=True)
    
    # Validate language support
    supported, error = check_language_support(language)
    if not supported:
        logger.error(error)
        print(f"DEBUG: check_language_support failed: {error}", flush=True)
        return {"error": error}
    
    print("DEBUG: Language support check passed. calling GroqClient...", flush=True)
    client = GroqClient()
    safe_input = test_input or ""
    system = (
        "You are a strict code runner. "
        "Your goal is to simulate the execution of the provided code in the SPECIFIED LANGUAGE ONLY. "
        "1. If the code is written in a different language than specified, you MUST return a syntax error "
        "   appropriate for the SPECIFIED language (e.g., if language is 'python' but code is C++, "
        "   return a NameError or SyntaxError that Python would raise). "
        "2. Execute ONLY the provided code exactly as-is using the specified language's standard rules. "
        "3. Use the provided input stdin; if empty, run with empty stdin. "
        "4. DO NOT propose alternative solutions. DO NOT modify the code. "
        "5. If the code prints nothing, return an empty string output. "
        "6. If there is an error, return it. "
        'Respond with JSON ONLY: {"output": "<stdout>"} or {"error": "<message>"}. '
        "No markdown, no extra keys, no code fences."
    )
    user = (
        f"Language: {language}\n"
        f"Question context (for reference only, do not solve): {question_description}\n"
        f"stdin:\n{safe_input}\n"
        "CODE:\n"
        f"{code}"
    )
    
    try:
        content = client.chat(
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            max_tokens=400,
        )
        parsed = _json_safe(content)
        if parsed is not None:
            return parsed
        # Fallback: strip code fences and try again
        stripped = re.sub(r"```.*?```", "", content, flags=re.DOTALL)
        parsed = _json_safe(stripped)
        if parsed is not None:
            return parsed
        return {"output": content}
    
    except RuntimeError as err:
        error_msg = f"Groq API execution error: {str(err)}"
        logger.error(error_msg)
        return {"error": error_msg}
    
    except Exception as err:
        error_msg = f"Unexpected compilation error: {type(err).__name__}: {str(err)}"
        logger.error(error_msg, exc_info=True)
        return {"error": error_msg}


def _json_safe(text):
    try:
        obj = json.loads(text)
        if isinstance(obj, dict) and ("output" in obj or "error" in obj):
            return obj
    except Exception:
        return None
    return None

