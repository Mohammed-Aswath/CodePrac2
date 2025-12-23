"""CODEPRAC 2.0 - Competitive Programming Practice Platform.

Main Flask application entry point.
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import DEBUG, FRONTEND_URL
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.college import college_bp
from routes.department import department_bp
from routes.batch import batch_bp
from routes.student import student_bp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app():
    """Create and configure Flask application."""
    app = Flask(__name__)
    
    # Configuration
    app.config["DEBUG"] = DEBUG
    
    # CORS setup - Allow all origins for testing
    CORS(app, 
         resources={r"/*": {"origins": "*"}},
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         max_age=3600)
    
    # Additional CORS headers for preflight requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = app.make_default_options_response()
            response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(college_bp)
    app.register_blueprint(department_bp)
    app.register_blueprint(batch_bp)
    app.register_blueprint(student_bp)
    
    # Root endpoint
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "name": "CODEPRAC 2.0",
            "status": "running",
            "version": "2.0.0",
            "endpoints": {
                "health": "/health",
                "auth": "/api/auth",
                "admin": "/api/admin",
                "college": "/api/college",
                "department": "/api/department",
                "batch": "/api/batch",
                "student": "/api/student"
            }
        }), 200
    
    # Health check endpoint
    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok", "message": "CODEPRAC 2.0 backend is running"}), 200
    
    # 404 handler
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": True,
            "code": "NOT_FOUND",
            "message": "Endpoint not found"
        }), 404
    
    # 500 handler
    @app.errorhandler(500)
    def server_error(error):
        logger.error(f"Server error: {error}")
        return jsonify({
            "error": True,
            "code": "INTERNAL_ERROR",
            "message": "Internal server error"
        }), 500
    
    logger.info("CODEPRAC 2.0 Flask app initialized")
    
    return app


# Create app instance at module level so it can be imported
app = create_app()


if __name__ == "__main__":
    # For development only
    app.run(host="0.0.0.0", port=5000, debug=DEBUG)
