"""AI Agents module for code execution, evaluation, and analysis."""
import logging
import sys

# Configure logging for agents
def configure_agent_logging():
    """Configure logging for AI agents."""
    logger = logging.getLogger(__name__)
    
    # Don't add handlers if already configured
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.DEBUG)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    
    return logger

# Initialize logging
agent_logger = configure_agent_logging()

__all__ = [
    'compiler_agent',
    'evaluator_agent',
    'efficiency_agent',
    'testcase_agent',
    'groq_client'
]

