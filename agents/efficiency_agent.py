"""Agent to analyze time/space complexity and improvements."""
import json
import logging
from .groq_client import GroqClient

logger = logging.getLogger(__name__)


def analyze_efficiency(question_description, code):
    """
    Return JSON: time_complexity, space_complexity, approach_summary,
    improvement_suggestions, optimal_method.
    """
    client = GroqClient()
    system = (
        "You are an algorithms tutor. Given a problem and student code, "
        "return ONLY JSON with fields: time_complexity, space_complexity, "
        "approach_summary, improvement_suggestions, optimal_method. "
        "Return valid JSON only, no markdown."
    )
    user = f"Problem:\n{question_description}\nCode:\n{code}"
    
    try:
        content = client.chat(
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            max_tokens=300,
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
        
        # Try direct JSON extraction
        if not json_str:
            try:
                json_str = content[content.index("{"):content.rindex("}")+1]
            except ValueError:
                json_str = None
        
        if json_str:
            try:
                parsed = json.loads(json_str)
                # Validate required fields
                if all(k in parsed for k in ["time_complexity", "space_complexity"]):
                    return parsed
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parsing failed: {str(e)[:100]}")
        
        # Fallback: return safe default with partial response
        logger.warning(f"Could not parse efficiency response, using fallback")
        return {
            "time_complexity": "unknown",
            "space_complexity": "unknown",
            "approach_summary": content[:200],
            "improvement_suggestions": content[200:400] if len(content) > 200 else "",
            "optimal_method": content[400:600] if len(content) > 400 else "",
            "raw_response": content
        }
    
    except RuntimeError as err:
        error_msg = f"Groq API error: {str(err)}"
        logger.error(error_msg)
        return {
            "time_complexity": "error",
            "space_complexity": "error",
            "approach_summary": "",
            "improvement_suggestions": error_msg[:100],
            "optimal_method": ""
        }
    
    except Exception as err:
        error_msg = f"Unexpected efficiency analysis error: {type(err).__name__}: {str(err)}"
        logger.error(error_msg, exc_info=True)
        return {
            "time_complexity": "error",
            "space_complexity": "error",
            "approach_summary": "",
            "improvement_suggestions": error_msg[:100],
            "optimal_method": ""
        }

