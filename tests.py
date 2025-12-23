"""Integration tests for CODEPRAC 2.0 backend.

This file provides test examples for all major workflows.
Run with: python -m pytest tests.py -v
"""

import pytest
from app import create_app
from auth import create_jwt_token, decode_jwt_token
from models import CollegeModel, DepartmentModel, BatchModel, StudentModel
import json


@pytest.fixture
def client():
    """Create Flask test client."""
    app = create_app()
    app.config["TESTING"] = True
    
    with app.test_client() as client:
        yield client


@pytest.fixture
def admin_token():
    """Create admin JWT token."""
    return create_jwt_token({
        "firebase_uid": "admin123",
        "role": "admin",
        "admin_id": "admin123"
    })


@pytest.fixture
def college_token():
    """Create college JWT token."""
    return create_jwt_token({
        "firebase_uid": "college123",
        "role": "college",
        "college_id": "college123"
    })


@pytest.fixture
def department_token():
    """Create department JWT token."""
    return create_jwt_token({
        "firebase_uid": "dept123",
        "role": "department",
        "department_id": "dept123",
        "college_id": "college123"
    })


@pytest.fixture
def student_token():
    """Create student JWT token."""
    return create_jwt_token({
        "firebase_uid": "student123",
        "role": "student",
        "student_id": "student123",
        "batch_id": "batch123",
        "department_id": "dept123",
        "college_id": "college123"
    })


class TestHealthCheck:
    """Test health check endpoint."""
    
    def test_health_check(self, client):
        """Test that health endpoint returns 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "ok"


class TestAdminEndpoints:
    """Test admin API endpoints."""
    
    def test_create_college(self, client, admin_token):
        """Test creating a college."""
        response = client.post(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Test College", "email": "college@example.com"}
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert not data["error"]
        assert "college_id" in data["data"]
    
    def test_create_college_missing_fields(self, client, admin_token):
        """Test creating college without required fields."""
        response = client.post(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Test College"}
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["error"]
    
    def test_list_colleges(self, client, admin_token):
        """Test listing colleges."""
        response = client.get(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert not data["error"]
        assert "colleges" in data["data"]
    
    def test_create_department(self, client, admin_token):
        """Test creating a department."""
        # First create a college
        college_resp = client.post(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Test College", "email": "college@example.com"}
        )
        college_id = json.loads(college_resp.data)["data"]["college_id"]
        
        # Create department
        response = client.post(
            "/api/admin/departments",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "college_id": college_id,
                "name": "Test Department",
                "email": "dept@example.com"
            }
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert not data["error"]
    
    def test_disable_college(self, client, admin_token):
        """Test disabling a college."""
        # Create college
        college_resp = client.post(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Test College", "email": "college@example.com"}
        )
        college_id = json.loads(college_resp.data)["data"]["college_id"]
        
        # Disable it
        response = client.post(
            f"/api/admin/colleges/{college_id}/disable",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert not data["error"]


class TestCollegeEndpoints:
    """Test college API endpoints."""
    
    def test_list_departments(self, client, college_token):
        """Test college can list their departments."""
        response = client.get(
            "/api/college/departments",
            headers={"Authorization": f"Bearer {college_token}"}
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert not data["error"]
    
    def test_college_cannot_access_admin(self, client, college_token):
        """Test college cannot access admin endpoints."""
        response = client.get(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {college_token}"}
        )
        assert response.status_code == 403


class TestDepartmentEndpoints:
    """Test department API endpoints."""
    
    def test_create_topic(self, client, department_token):
        """Test department can create topics."""
        response = client.post(
            "/api/department/topics",
            headers={"Authorization": f"Bearer {department_token}"},
            json={"name": "Arrays"}
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert not data["error"]
    
    def test_create_batch(self, client, department_token):
        """Test department can create batches."""
        response = client.post(
            "/api/department/batches",
            headers={"Authorization": f"Bearer {department_token}"},
            json={"batch_name": "2023-2027"}
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert not data["error"]
    
    def test_invalid_batch_name(self, client, department_token):
        """Test invalid batch name format."""
        response = client.post(
            "/api/department/batches",
            headers={"Authorization": f"Bearer {department_token}"},
            json={"batch_name": "invalid"}
        )
        assert response.status_code == 400


class TestStudentEndpoints:
    """Test student API endpoints."""
    
    def test_get_topics(self, client, student_token):
        """Test student can get topics."""
        response = client.get(
            "/api/student/topics",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        # May return 404 if department/topics don't exist, but request should be valid
        assert response.status_code in [200, 404]
    
    def test_student_cannot_access_admin(self, client, student_token):
        """Test student cannot access admin endpoints."""
        response = client.get(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert response.status_code == 403
    
    def test_student_cannot_access_department(self, client, student_token):
        """Test student cannot access department endpoints."""
        response = client.post(
            "/api/department/topics",
            headers={"Authorization": f"Bearer {student_token}"},
            json={"name": "Arrays"}
        )
        assert response.status_code == 403


class TestAuthentication:
    """Test authentication and authorization."""
    
    def test_missing_auth_token(self, client):
        """Test request without auth token."""
        response = client.get("/api/admin/colleges")
        assert response.status_code == 401
        data = json.loads(response.data)
        assert data["error"]
    
    def test_invalid_token_format(self, client):
        """Test invalid token format."""
        response = client.get(
            "/api/admin/colleges",
            headers={"Authorization": "Invalid token"}
        )
        assert response.status_code == 401
    
    def test_expired_token(self, client):
        """Test handling of expired tokens."""
        from datetime import datetime, timedelta
        from config import JWT_SECRET, JWT_ALGORITHM
        import jwt
        
        # Create expired token
        payload = {
            "firebase_uid": "user123",
            "role": "admin",
            "iat": datetime.utcnow() - timedelta(days=2),
            "exp": datetime.utcnow() - timedelta(days=1)
        }
        expired_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        response = client.get(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401
    
    def test_token_decode(self):
        """Test JWT token creation and decoding."""
        from auth import create_jwt_token, decode_jwt_token
        
        user_data = {
            "firebase_uid": "test123",
            "role": "admin",
            "admin_id": "admin123"
        }
        
        token = create_jwt_token(user_data)
        decoded = decode_jwt_token(token)
        
        assert decoded["firebase_uid"] == user_data["firebase_uid"]
        assert decoded["role"] == user_data["role"]


class TestErrorHandling:
    """Test error handling."""
    
    def test_404_not_found(self, client):
        """Test 404 for non-existent endpoint."""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data["error"]
    
    def test_invalid_json(self, client, admin_token):
        """Test handling of invalid JSON."""
        response = client.post(
            "/api/admin/colleges",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            data="invalid json"
        )
        # Should handle gracefully
        assert response.status_code in [400, 500]


class TestValidation:
    """Test input validation."""
    
    def test_invalid_email_format(self, client, admin_token):
        """Test invalid email validation."""
        response = client.post(
            "/api/admin/colleges",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Test", "email": "invalid-email"}
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "email" in data["message"].lower() or data["code"] == "INVALID_EMAIL"
    
    def test_invalid_username(self, client, department_token):
        """Test invalid username validation."""
        from utils import validate_username
        
        assert not validate_username("ab")  # Too short
        assert not validate_username("a" * 21)  # Too long
        assert not validate_username("user@123")  # Invalid chars
        assert validate_username("user123")  # Valid


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
