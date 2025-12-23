"""Request validation middleware for Flask routes."""
from functools import wraps
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)


def validate_json(*required_fields):
    """Decorator to validate JSON request has required fields.
    
    Usage:
        @app.route('/api/submit', methods=['POST'])
        @validate_json('code', 'language', 'question_id')
        def submit_code():
            data = request.get_json()
            # Process data
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                logger.warning(f"Non-JSON request to {request.path}")
                return jsonify({
                    "error": True,
                    "message": "Content-Type must be application/json"
                }), 400
            
            data = request.get_json()
            if data is None:
                logger.warning(f"Failed to parse JSON in {request.path}")
                return jsonify({
                    "error": True,
                    "message": "Invalid JSON in request body"
                }), 400
            
            missing = [field for field in required_fields if not data.get(field)]
            
            if missing:
                logger.warning(f"Missing fields in {request.path}: {missing}")
                return jsonify({
                    "error": True,
                    "message": f"Missing required fields: {', '.join(missing)}"
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_query_params(*required_params):
    """Decorator to validate query string parameters.
    
    Usage:
        @app.route('/api/search')
        @validate_query_params('query', 'limit')
        def search():
            query = request.args.get('query')
            limit = request.args.get('limit')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            missing = [param for param in required_params if not request.args.get(param)]
            
            if missing:
                logger.warning(f"Missing query params in {request.path}: {missing}")
                return jsonify({
                    "error": True,
                    "message": f"Missing required query parameters: {', '.join(missing)}"
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_content_length(max_size_kb=50):
    """Decorator to validate request body size.
    
    Args:
        max_size_kb: Maximum allowed size in KB (default: 50KB)
    
    Usage:
        @app.route('/api/submit', methods=['POST'])
        @validate_content_length(100)
        def submit_code():
            pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            content_length = request.content_length
            max_bytes = max_size_kb * 1024
            
            if content_length and content_length > max_bytes:
                logger.warning(
                    f"Request body too large: {content_length} bytes (max {max_bytes})"
                )
                return jsonify({
                    "error": True,
                    "message": f"Request body exceeds {max_size_kb}KB limit"
                }), 413
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def handle_validation_error(f):
    """Decorator to gracefully handle validation errors.
    
    Usage:
        @app.route('/api/validate')
        @handle_validation_error
        def validate():
            # Any exceptions raised will be caught and returned as JSON
            pass
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"Validation error in {request.path}: {str(e)}")
            return jsonify({
                "error": True,
                "message": f"Validation error: {str(e)}"
            }), 400
        except Exception as e:
            logger.error(f"Unexpected error in {request.path}: {str(e)}", exc_info=True)
            return jsonify({
                "error": True,
                "message": "Internal server error"
            }), 500
    
    return decorated_function
