"""Thin Groq API client wrapper with timeouts and error handling."""
import os
import logging
import requests

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
logger = logging.getLogger(__name__)


class GroqClient:
    """Simple wrapper for Groq chat completions with comprehensive error handling."""

    def __init__(self, api_key=None):
        # Allow fallback keys
        env_key = os.environ.get("GROQ_API_KEY") or os.environ.get("GROQ_API_KEY_FALLBACK")
        self.api_key = api_key or env_key
        
        if not self.api_key:
            logger.error("GROQ_API_KEY environment variable not set!")

    def chat(self, messages, model="llama-3.3-70b-versatile", temperature=0.1, max_tokens=800):
        """Query Groq API with error handling.
        
        Returns:
            str: Response content on success
            
        Raises:
            RuntimeError: On API failure with detailed error info
        """
        if not self.api_key:
            error_msg = "GROQ_API_KEY not configured"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        try:
            resp = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            
            if "choices" not in data or not data["choices"]:
                error_msg = f"Invalid Groq response: missing choices. Response: {data}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)
            
            return data["choices"][0]["message"]["content"]
        
        except requests.exceptions.Timeout:
            error_msg = "Groq API request timed out (30s limit)"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        except requests.exceptions.ConnectionError as err:
            error_msg = f"Groq API connection error: {err}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        except requests.exceptions.HTTPError as err:
            error_msg = f"Groq API HTTP error: {err.response.status_code} - {err.response.text}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        except Exception as err:
            error_msg = f"Groq API error: {type(err).__name__}: {err}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

