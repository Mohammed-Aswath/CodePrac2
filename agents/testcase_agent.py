"""Agent to generate hidden test cases using Groq."""
import json
import logging
from .groq_client import GroqClient

logger = logging.getLogger(__name__)


def validate_testcase(tc):
    """Validate test case structure.
    
    Returns:
        (bool, str or None): (valid, error_message)
    """
    if not isinstance(tc, dict):
        return False, "Test case must be a dictionary"
    if "input" not in tc:
        return False, "Test case missing 'input' key"
    if "expected_output" not in tc:
        return False, "Test case missing 'expected_output' key"
    if not isinstance(tc.get("input"), str):
        return False, "Test case input must be string"
    if not isinstance(tc.get("expected_output"), str):
        return False, "Test case expected_output must be string"
    return True, None


def generate_testcases_for_question(description, sample_input, sample_output):
    """Return list of testcases using Groq; JSON only.
    
    Returns:
        list: List of {"input": str, "expected_output": str}
    """
    client = GroqClient()
    system = (
        "You are a test case generator for competitive programming. "
        "Given a problem description and sample I/O, output ONLY JSON array "
        'of objects: [{\"input\": \"...\", \"expected_output\": \"...\"}]. '
        "Include edge, typical, and large cases. No explanations. Return valid JSON only."
    )
    user = f"Problem:\n{description}\nSample input:\n{sample_input}\nSample output:\n{sample_output}"
    
    try:
        content = client.chat(
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            max_tokens=600,
        )
        
        # Multiple extraction strategies
        json_str = None
        
        # Try markdown JSON block
        for delimiter in ["```json", "```"]:
            if delimiter in content:
                try:
                    json_str = content.split(delimiter)[1].split("```")[0].strip()
                    break
                except IndexError:
                    continue
        
        # Try direct JSON array extraction
        if not json_str:
            try:
                json_str = content[content.index("["):content.rindex("]")+1]
            except ValueError:
                json_str = None
        
        if json_str:
            try:
                testcases = json.loads(json_str)
                
                if not isinstance(testcases, list):
                    logger.error(f"LLM returned non-list JSON: {type(testcases)}")
                    return []
                
                # Validate each test case
                validated = []
                errors = []
                
                for i, tc in enumerate(testcases):
                    valid, error = validate_testcase(tc)
                    if not valid:
                        errors.append(f"Test case {i+1}: {error}")
                    else:
                        validated.append(tc)
                
                if errors:
                    logger.warning(f"Test case validation errors: {errors}")
                
                if not validated:
                    logger.error(f"No valid test cases generated: {'; '.join(errors)}")
                    return []
                
                logger.info(f"Successfully generated {len(validated)} test cases")
                return validated
            
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing failed: {str(e)[:100]}")
                return []
        
        logger.error(f"Could not extract JSON from LLM response: {content[:100]}")
        return []
    
    except RuntimeError as err:
        error_msg = f"Groq API error: {str(err)}"
        logger.error(error_msg)
        return []
    
    except Exception as err:
        error_msg = f"Unexpected test case generation error: {type(err).__name__}: {str(err)}"
        logger.error(error_msg, exc_info=True)
        return []

