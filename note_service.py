"""
Notes Management Service Module
Handles role-aware notes creation, retrieval, and management
"""

from models import NoteModel, BatchModel, DepartmentModel, CollegeModel
from utils import error_response, success_response, audit_log
from flask import jsonify


class NoteService:
    """Centralized service for note management with role-based access control."""
    
    @staticmethod
    def validate_note_data(data):
        """
        Validate required note fields.
        
        Args:
            data (dict): Note data to validate
            
        Returns:
            tuple: (is_valid, error_message)
        """
        required_fields = ["title", "drive_link"]
        
        for field in required_fields:
            if not data.get(field) or not str(data.get(field)).strip():
                return False, f"Missing required field: {field}"
        
        if len(str(data.get("title")).strip()) < 2:
            return False, "Title must be at least 2 characters"
        
        # Basic URL validation for drive_link
        drive_link = str(data.get("drive_link")).strip()
        if not drive_link.startswith(("http://", "https://", "drive.google.com")):
            return False, "Invalid drive link format"
        
        return True, None
    
    @staticmethod
    def create_note_by_admin(request_user, data):
        """
        Create note as Super Admin (can choose any college/department/batch).
        
        Args:
            request_user (dict): Authenticated user data
            data (dict): Note data
            
        Returns:
            tuple: (response, status_code)
        """
        # Validate required fields
        is_valid, error_msg = NoteService.validate_note_data(data)
        if not is_valid:
            return error_response("INVALID_INPUT", error_msg), 400
        
        # Super admin must specify college, department, and batch
        if not data.get("college_id") or not data.get("department_id") or not data.get("batch_id"):
            return error_response("INVALID_INPUT", "Super Admin must specify college_id, department_id, and batch_id"), 400
        
        college_id = data.get("college_id")
        dept_id = data.get("department_id")
        batch_id = data.get("batch_id")
        
        # Verify college exists and is not disabled
        college = CollegeModel().get(college_id)
        if not college:
            return error_response("NOT_FOUND", "College not found"), 404
        if college.get("is_disabled", False):
            return error_response("FORBIDDEN", "College is disabled"), 403
        
        # Verify department exists, belongs to college, and is not disabled
        dept = DepartmentModel().get(dept_id)
        if not dept or dept.get("college_id") != college_id:
            return error_response("NOT_FOUND", "Department not found in this college"), 404
        if dept.get("is_disabled", False):
            return error_response("FORBIDDEN", "Department is disabled"), 403
        
        # Verify batch exists, belongs to department, and is not disabled
        batch = BatchModel().get(batch_id)
        if not batch or batch.get("department_id") != dept_id:
            return error_response("NOT_FOUND", "Batch not found in this department"), 404
        if batch.get("is_disabled", False):
            return error_response("FORBIDDEN", "Batch is disabled"), 403
        
        return NoteService._save_note(college_id, dept_id, batch_id, request_user.get("uid"), data)
    
    @staticmethod
    def create_note_by_batch(request_user, data):
        """
        Create note as Batch Admin (can only create notes for their batch).
        
        Args:
            request_user (dict): Authenticated user data
            data (dict): Note data
            
        Returns:
            tuple: (response, status_code)
        """
        # Validate required fields
        is_valid, error_msg = NoteService.validate_note_data(data)
        if not is_valid:
            return error_response("INVALID_INPUT", error_msg), 400
        
        batch_id = request_user.get("batch_id")
        dept_id = request_user.get("department_id")
        college_id = request_user.get("college_id")
        
        if not batch_id:
            return error_response("NO_BATCH", "Batch ID not found in token"), 400
        
        # Verify batch exists and is not disabled
        batch = BatchModel().get(batch_id)
        if not batch:
            return error_response("NOT_FOUND", "Batch not found"), 404
        if batch.get("is_disabled", False):
            return error_response("FORBIDDEN", "Batch is disabled"), 403
        
        return NoteService._save_note(college_id, dept_id, batch_id, request_user.get("uid"), data)
    
    @staticmethod
    def _save_note(college_id, dept_id, batch_id, user_uid, data):
        """
        Save note to database.
        
        Args:
            college_id (str): College ID
            dept_id (str): Department ID
            batch_id (str): Batch ID
            user_uid (str): User UID (admin)
            data (dict): Note data
            
        Returns:
            tuple: (response, status_code)
        """
        try:
            note_data = {
                "title": data.get("title").strip(),
                "drive_link": data.get("drive_link").strip(),
                "college_id": college_id,
                "department_id": dept_id,
                "batch_id": batch_id,
                "is_disabled": False
            }
            
            note_id = NoteModel().create(note_data)
            
            # Audit log
            audit_log(user_uid, "create_note", "note", note_id, {"title": data.get("title")})
            
            return success_response({"note_id": note_id}, "Note created successfully", status_code=201)
        except Exception as e:
            return error_response("CREATE_ERROR", str(e)), 500
    
    @staticmethod
    def get_notes_for_batch(batch_id):
        """
        Get all notes for a batch.
        
        Args:
            batch_id (str): Batch ID
            
        Returns:
            tuple: (response, status_code)
        """
        try:
            notes = NoteModel().query(batch_id=batch_id, is_disabled=False)
            return success_response({"notes": notes if notes else []})
        except Exception as e:
            return error_response("QUERY_ERROR", str(e))
    
    @staticmethod
    def get_note(request_user, note_id):
        """
        Get a single note (enforces batch-level access).
        
        Args:
            request_user (dict): Authenticated user data
            note_id (str): Note ID
            
        Returns:
            tuple: (response, status_code)
        """
        note = NoteModel().get(note_id)
        
        if not note:
            return error_response("NOT_FOUND", "Note not found", status_code=404)
        
        # For batch-level users, enforce batch scope
        if request_user.get("role") == "batch":
            if note.get("batch_id") != request_user.get("batch_id"):
                return error_response("FORBIDDEN", "Note not found in your batch", status_code=403)
        
        return success_response({"note": note})
    
    @staticmethod
    def update_note(request_user, note_id, data):
        """
        Update a note (enforces role-based access).
        
        Args:
            request_user (dict): Authenticated user data
            note_id (str): Note ID
            data (dict): Update data
            
        Returns:
            tuple: (response, status_code)
        """
        note = NoteModel().get(note_id)
        
        if not note:
            return error_response("NOT_FOUND", "Note not found", status_code=404)
        
        # Batch-level users can only update their own batch's notes
        if request_user.get("role") == "batch":
            if note.get("batch_id") != request_user.get("batch_id"):
                return error_response("FORBIDDEN", "Cannot update note outside your batch", status_code=403)
        
        # Validate if title or drive_link are being updated
        if "title" in data and data["title"]:
            if len(str(data["title"]).strip()) < 2:
                return error_response("INVALID_INPUT", "Title must be at least 2 characters", status_code=400)
        
        if "drive_link" in data and data["drive_link"]:
            drive_link = str(data["drive_link"]).strip()
            if not drive_link.startswith(("http://", "https://", "drive.google.com")):
                return error_response("INVALID_INPUT", "Invalid drive link format", status_code=400)
        
        try:
            update_data = {}
            if "title" in data and data["title"]:
                update_data["title"] = data["title"].strip()
            if "drive_link" in data and data["drive_link"]:
                update_data["drive_link"] = data["drive_link"].strip()
            
            if not update_data:
                return error_response("INVALID_INPUT", "Nothing to update", status_code=400)
            
            NoteModel().update(note_id, update_data)
            
            # Audit log
            audit_log(request_user.get("uid"), "update_note", "note", note_id, update_data)
            
            return success_response(None, "Note updated successfully")
        except Exception as e:
            return error_response("UPDATE_ERROR", str(e), status_code=500)
    
    @staticmethod
    def delete_note(request_user, note_id):
        """
        Delete a note (soft delete via is_disabled flag).
        
        Args:
            request_user (dict): Authenticated user data
            note_id (str): Note ID
            
        Returns:
            tuple: (response, status_code)
        """
        note = NoteModel().get(note_id)
        
        if not note:
            return error_response("NOT_FOUND", "Note not found", status_code=404)
        
        # Batch-level users can only delete their own batch's notes
        if request_user.get("role") == "batch":
            if note.get("batch_id") != request_user.get("batch_id"):
                return error_response("FORBIDDEN", "Cannot delete note outside your batch", status_code=403)
        
        try:
            NoteModel().delete(note_id)
            
            # Audit log
            audit_log(request_user.get("uid"), "delete_note", "note", note_id, {})
            
            return success_response(None, "Note deleted successfully")
        except Exception as e:
            return error_response("DELETE_ERROR", str(e), status_code=500)
