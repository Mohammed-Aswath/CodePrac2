"""CODEPRAC 2.0 - Competitive Programming Practice Platform.

Main Flask application entry point.
"""
import logging
import sys
import os

# Configure logging FIRST
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    logger.info("Starting Flask app initialization...")
    
    from flask import Flask, jsonify, request
    logger.info("✓ Flask imported")
    
    from flask_cors import CORS
    logger.info("✓ Flask-CORS imported")
    
    from config import DEBUG, FRONTEND_URL
    logger.info("✓ Config imported")
    
    from routes.auth import auth_bp
    logger.info("✓ Auth routes imported")
    
    from routes.admin import admin_bp
    logger.info("✓ Admin routes imported")
    
    from routes.college import college_bp
    logger.info("✓ College routes imported")
    
    from routes.department import department_bp
    logger.info("✓ Department routes imported")
    
    from routes.batch import batch_bp
    logger.info("✓ Batch routes imported")
    
    from routes.student import student_bp
    logger.info("✓ Student routes imported")
    
except Exception as e:
    logger.error(f"✗ Import failed: {e}", exc_info=True)
    sys.exit(1)


def create_app():
    """Create and configure Flask application."""
    try:
        logger.info("Creating Flask app instance...")
        app = Flask(__name__)
        
        # Configuration
        app.config["DEBUG"] = DEBUG
        app.config['JSON_SORT_KEYS'] = False
        
        logger.info("✓ Flask app instance created")
        
        # CORS setup - Allow all origins for testing
        CORS(app, 
             resources={r"/*": {"origins": "*"}},
             methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             allow_headers=["Content-Type", "Authorization"],
             max_age=3600)
        logger.info("✓ CORS configured")
        
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
        logger.info("Registering blueprints...")
        app.register_blueprint(auth_bp)
        app.register_blueprint(admin_bp)
        app.register_blueprint(college_bp)
        app.register_blueprint(department_bp)
        app.register_blueprint(batch_bp)
        app.register_blueprint(student_bp)
        logger.info("✓ All blueprints registered")
        
        # DEBUG: Print all registered routes
        logger.info("Registered Routes:")
        for rule in app.url_map.iter_rules():
            logger.info(f"{rule.endpoint}: {rule}")
        
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
            logger.info("Health check received")
            return jsonify({"status": "ok", "message": "CODEPRAC 2.0 backend is running"}), 200
        
        # 404 handler
        @app.errorhandler(404)
        def not_found(error):
            logger.warning(f"404 Not Found: {error}")
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
        
        logger.info("✓ CODEPRAC 2.0 Flask app initialized successfully")
        
        return app
    
    except Exception as e:
        logger.error(f"✗ App creation failed: {e}", exc_info=True)
        sys.exit(1)


# Create app instance at module level for Gunicorn
try:
    logger.info("Creating Flask app for production...")
    app = create_app()
    logger.info("✓ Flask app instance ready for Gunicorn")
except Exception as e:
    logger.error(f"✗ Failed to create app: {e}", exc_info=True)
    sys.exit(1)


if __name__ == "__main__":
    # For development only
    port = int(os.getenv('PORT', 5000))
    logger.info(f"Starting Flask development server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=DEBUG)
