"""Utility functions for CODEPRAC 2.0."""
import csv
import io
import re
from datetime import datetime
from flask import jsonify


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_username(username):
    """Validate username (alphanumeric, 3-20 chars)."""
    if not username or len(username) < 3 or len(username) > 20:
        return False
    return username.isalnum()


def validate_batch_name(batch_name):
    """Validate batch name format (e.g., 2023-2027)."""
    pattern = r'^\d{4}-\d{4}$'
    return re.match(pattern, batch_name) is not None


def validate_google_drive_link(link):
    """Validate Google Drive link."""
    return "drive.google.com" in link or "docs.google.com" in link


def parse_csv_students(csv_file):
    """Parse CSV file for student upload.
    
    REQUIRED CSV columns (exact order):
    username,email,password,college_id,department_id,batch_id
    
    Args:
        csv_file: File-like object
    
    Returns:
        (List of student dicts with hierarchy, None) on success
        (None, error_message) on failure
    """
    try:
        stream = io.StringIO(csv_file.read().decode("utf-8"))
        reader = csv.DictReader(stream)
        
        # Validate all required columns are present
        required_columns = {"username", "email", "password", "college_id", "department_id", "batch_id"}
        if not reader.fieldnames or set(reader.fieldnames) != required_columns:
            return None, f"CSV must have exactly these columns: {', '.join(sorted(required_columns))}"
        
        students = []
        for idx, row in enumerate(reader, start=2):
            # Validate username
            if not row.get("username"):
                return None, f"Row {idx}: username is required"
            if not validate_username(row["username"]):
                return None, f"Row {idx}: invalid username (alphanumeric, 3-20 chars)"
            
            # Validate email
            if not row.get("email"):
                return None, f"Row {idx}: email is required"
            if not validate_email(row["email"]):
                return None, f"Row {idx}: invalid email format"
            
            # Validate password
            if not row.get("password"):
                return None, f"Row {idx}: password is required"
            if len(row["password"]) < 6:
                return None, f"Row {idx}: password must be at least 6 chars"
            
            # Validate hierarchy fields (CRITICAL - no partial students)
            if not row.get("college_id"):
                return None, f"Row {idx}: college_id is required and cannot be empty"
            if not row.get("department_id"):
                return None, f"Row {idx}: department_id is required and cannot be empty"
            if not row.get("batch_id"):
                return None, f"Row {idx}: batch_id is required and cannot be empty"
            
            students.append({
                "username": row["username"].strip(),
                "email": row["email"].strip(),
                "password": row["password"].strip(),
                "college_id": row["college_id"].strip(),
                "department_id": row["department_id"].strip(),
                "batch_id": row["batch_id"].strip()
            })
        
        if len(students) == 0:
            return None, "CSV must contain at least one student"
        
        return students, None
    
    except Exception as e:
        return None, f"CSV parsing error: {str(e)}"


def error_response(code, message, details=None, status_code=400):
    """Create standardized error response."""
    response = {
        "error": True,
        "code": code,
        "message": message
    }
    if details:
        response["details"] = details
    return jsonify(response), status_code


def success_response(data=None, message="Success", status_code=200):
    """Create standardized success response.

    Returns a Flask response (jsonified body) and the given status code.
    Use the `status_code` parameter when creating resources (201) or other statuses.
    """
    response = {"error": False, "message": message}
    if data:
        response["data"] = data
    return jsonify(response), status_code


def audit_log(admin_id, action, target_type, target_id, details=None):
    """Create audit log entry."""
    from models import AuditLogModel
    
    log_data = {
        "admin_id": admin_id,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "timestamp": datetime.utcnow(),
        "details": details or {}
    }
    AuditLogModel().create(log_data)
