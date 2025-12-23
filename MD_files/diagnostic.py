"""Comprehensive codebase diagnostic."""
import sys
import os
import json

print("=" * 60)
print("CODEPRAC 2.0 CODEBASE DIAGNOSTIC")
print("=" * 60)

# 1. Check Python version
print(f"\n✓ Python Version: {sys.version}")

# 2. Check if all required files exist
required_files = [
    'app.py', 'auth.py', 'config.py', 'models.py', 
    'firebase_init.py', 'utils.py', 'requirements.txt',
    'firebase-key.json', 'index.html'
]

print("\n[1] Checking required files:")
for file in required_files:
    exists = os.path.exists(file)
    status = "✓" if exists else "✗"
    print(f"  {status} {file}")

# 3. Check routes folder
print("\n[2] Checking routes:")
routes = ['__init__.py', 'auth.py', 'admin.py', 'college.py', 'department.py', 'student.py']
for route in routes:
    path = f"routes/{route}"
    exists = os.path.exists(path)
    status = "✓" if exists else "✗"
    print(f"  {status} {path}")

# 4. Check agents folder
print("\n[3] Checking agents:")
agents = ['__init__.py', 'compiler_agent.py', 'evaluator_agent.py', 'efficiency_agent.py', 'testcase_agent.py', 'groq_client.py']
for agent in agents:
    path = f"agents/{agent}"
    exists = os.path.exists(path)
    status = "✓" if exists else "✗"
    print(f"  {status} {path}")

# 5. Try importing core modules
print("\n[4] Testing imports:")
try:
    import flask
    print("  ✓ Flask")
except ImportError as e:
    print(f"  ✗ Flask: {e}")

try:
    import firebase_admin
    print("  ✓ Firebase Admin")
except ImportError as e:
    print(f"  ✗ Firebase Admin: {e}")

try:
    import jwt
    print("  ✓ PyJWT")
except ImportError as e:
    print(f"  ✗ PyJWT: {e}")

try:
    from config import JWT_SECRET, JWT_ALGORITHM
    print("  ✓ config.py")
except Exception as e:
    print(f"  ✗ config.py: {e}")

try:
    from firebase_init import get_db, get_auth
    print("  ✓ firebase_init.py")
except Exception as e:
    print(f"  ✗ firebase_init.py: {e}")

try:
    from auth import create_jwt_token, decode_jwt_token
    print("  ✓ auth.py")
except Exception as e:
    print(f"  ✗ auth.py: {e}")

try:
    from models import CollegeModel, StudentModel
    print("  ✓ models.py")
except Exception as e:
    print(f"  ✗ models.py: {e}")

# 6. Check Flask app initialization
print("\n[5] Testing Flask app:")
try:
    from app import app
    print("  ✓ app.py imports successfully")
    print(f"  ✓ Flask debug mode: {app.debug}")
    print(f"  ✓ CORS enabled: {app.config.get('CORS_ORIGINS', 'Not set')}")
except Exception as e:
    print(f"  ✗ app.py: {e}")

# 7. List all registered routes
print("\n[6] Registered routes:")
try:
    from app import app
    routes_list = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            routes_list.append({
                'endpoint': rule.endpoint,
                'path': str(rule),
                'methods': list(rule.methods - {'HEAD', 'OPTIONS'})
            })
    
    routes_list.sort(key=lambda x: x['path'])
    
    for route in routes_list:
        print(f"  {route['methods']} {route['path']}")
except Exception as e:
    print(f"  ✗ Error listing routes: {e}")

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)