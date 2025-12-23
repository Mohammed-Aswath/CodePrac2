"""JWT and Authentication utilities."""
import jwt
import json
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION
from firebase_init import get_auth
import requests


def create_jwt_token(user_data):
    """Create JWT token from user data.
    
    Args:
        user_data: Dict with keys {firebase_uid, role, student_id, batch_id, 
                                   department_id, college_id}
    
    Returns:
        JWT token string
    """
    payload = {
        **user_data,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + JWT_EXPIRATION
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt_token(token):
    """Decode JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload or None if invalid
    """
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_request():
    """Extract JWT token from request Authorization header.
    
    Returns:
        Token string or None
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


def require_auth(allowed_roles=None):
    """Decorator to require authentication and optionally check roles.
    
    Args:
        allowed_roles: List of allowed roles (None = any authenticated)
    
    Returns:
        Decorator function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Allow CORS preflight (OPTIONS) requests to bypass auth checks
            if request.method == "OPTIONS":
                return "", 200

            token = get_token_from_request()
            if not token:
                return jsonify({"error": True, "code": "NO_AUTH", "message": "Missing authorization token"}), 401
            
            payload = decode_jwt_token(token)
            if not payload:
                return jsonify({"error": True, "code": "INVALID_TOKEN", "message": "Invalid or expired token"}), 401
            
            if allowed_roles and payload.get("role") not in allowed_roles:
                return jsonify({"error": True, "code": "FORBIDDEN", "message": "Insufficient permissions"}), 403
            
            request.user = payload
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def register_user_firebase(email, password, name=None, role=None):
    """Register user in Firebase Auth and create a user document in Firestore.

    Args:
        email: User email
        password: User password
        name: Optional display name
        role: Optional role string (admin/college/department/batch/student)

    Returns:
        Firebase UID or None on error
    """
    try:
        user = get_auth().create_user(email=email, password=password, display_name=name)
        uid = user.uid
        # set custom claims for role if provided
        if role:
            try:
                get_auth().set_custom_user_claims(uid, {"role": role})
            except Exception:
                # non-fatal if setting claims fails
                pass
        # create a minimal user document in Firestore under collection 'User'
        try:
            from firebase_init import db
            from datetime import datetime
            user_doc = {
                "uid": uid,
                "email": email,
                "name": name,
                "role": role or "student",
                "is_disabled": False,
                "created_at": datetime.utcnow()
            }
            db.collection("User").document(uid).set(user_doc)
        except Exception as e:
            print(f"Failed to create user doc in Firestore: {e}")
            # proceed even if Firestore write fails
        return uid
    except Exception as e:
        print(f"Firebase user creation error: {e}")
        return None


def send_password_reset_email(email):
    """Send password reset email via Firebase.
    
    Args:
        email: User email
    
    Returns:
        True if sent, False otherwise
    """
    try:
        get_auth().send_password_reset_email(email)
        return True
    except Exception as e:
        print(f"Password reset email error: {e}")
        return False


def disable_user_firebase(uid):
    """Disable user in Firebase Auth.
    
    Args:
        uid: Firebase UID
    
    Returns:
        True if successful, False otherwise
    """
    try:
        get_auth().update_user(uid, disabled=True)
        return True
    except Exception as e:
        print(f"Firebase disable user error: {e}")
        return False


def enable_user_firebase(uid):
    """Enable user in Firebase Auth.
    
    Args:
        uid: Firebase UID
    
    Returns:
        True if successful, False otherwise
    """
    try:
        get_auth().update_user(uid, disabled=False)
        return True
    except Exception as e:
        print(f"Firebase enable user error: {e}")
        return False


def verify_firebase_token(token):
    """Verify Firebase ID token (for frontend token validation).
    
    Args:
        token: Firebase ID token
    
    Returns:
        Decoded token or None
    """
    try:
        return get_auth().verify_id_token(token)
    except Exception as e:
        print(f"Firebase token verification error: {e}")
        return None
