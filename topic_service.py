"""
Topic Management Service Module
Handles role-aware topic creation, retrieval, and management
"""

from models import TopicModel, BatchModel, DepartmentModel, CollegeModel
from utils import error_response, success_response, audit_log
from flask import jsonify


class TopicService:
    """Centralized service for topic management with role-based access control."""
    
    @staticmethod
    def validate_topic_data(data):
        """
        Validate required topic fields.
        
        Args:
            data (dict): Topic data to validate
            
        Returns:
            tuple: (is_valid, error_message)
        """
        required_fields = ["topic_name"]
        
        for field in required_fields:
            if not data.get(field) or not str(data.get(field)).strip():
                return False, f"Missing required field: {field}"
        
        if len(str(data.get("topic_name")).strip()) < 2:
            return False, "Topic name must be at least 2 characters"
        
        return True, None
    
    @staticmethod
    def create_topic_by_admin(request_user, data):
        """
        Create topic as Super Admin (can choose any college/department/batch).
        
        Args:
            request_user (dict): Authenticated user data
            data (dict): Topic data
            
        Returns:
            tuple: (response, status_code)
        """
        # Validate required fields
        is_valid, error_msg = TopicService.validate_topic_data(data)
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
        
        return TopicService._save_topic(college_id, dept_id, batch_id, request_user.get("uid"), data)
    
    @staticmethod
    def create_topic_by_batch(request_user, data):
        """
        Create topic as Batch Admin (can only create topics for their batch).
        
        Args:
            request_user (dict): Authenticated user data
            data (dict): Topic data
            
        Returns:
            tuple: (response, status_code)
        """
        # Validate required fields
        is_valid, error_msg = TopicService.validate_topic_data(data)
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
        
        return TopicService._save_topic(college_id, dept_id, batch_id, request_user.get("uid"), data)
    
    @staticmethod
    def _save_topic(college_id, dept_id, batch_id, user_uid, data):
        """
        Save topic to database.
        
        Args:
            college_id (str): College ID
            dept_id (str): Department ID
            batch_id (str): Batch ID
            user_uid (str): User UID (admin)
            data (dict): Topic data
            
        Returns:
            tuple: (response, status_code)
        """
        try:
            topic_data = {
                "topic_name": data.get("topic_name").strip(),
                "college_id": college_id,
                "department_id": dept_id,
                "batch_id": batch_id,
                "is_disabled": False
            }
            
            topic_id = TopicModel().create(topic_data)
            
            # Audit log
            audit_log(user_uid, "create_topic", "topic", topic_id, {"topic_name": data.get("topic_name")})
            
            return success_response({"topic_id": topic_id}, "Topic created successfully", status_code=201)
        except Exception as e:
            return error_response("CREATE_ERROR", str(e)), 500
    
    @staticmethod
    def get_topics_for_batch(batch_id):
        """
        Get all topics for a batch.
        
        Args:
            batch_id (str): Batch ID
            
        Returns:
            tuple: (response, status_code)
        """
        print(f"🔍 get_topics_for_batch called with batch_id: {batch_id}")
        
        try:
            print(f"Querying TopicModel with batch_id={batch_id}, is_disabled=False")
            topics = TopicModel().query(batch_id=batch_id, is_disabled=False)
            print(f"Query returned type: {type(topics)}")
            print(f"Query returned {len(topics) if topics else 0} topics")
            print(f"Topics: {topics}")
            
            result = success_response({"topics": topics if topics else []})
            print(f"Returning result: {result}")
            return result
        except Exception as e:
            print(f"ERROR in get_topics_for_batch: {str(e)}")
            import traceback
            traceback.print_exc()
            return error_response("QUERY_ERROR", str(e))
    
    @staticmethod
    def get_topic(request_user, topic_id):
        """
        Get a single topic (enforces batch-level access).
        
        Args:
            request_user (dict): Authenticated user data
            topic_id (str): Topic ID
            
        Returns:
            tuple: (response, status_code)
        """
        topic = TopicModel().get(topic_id)
        
        if not topic:
            return error_response("NOT_FOUND", "Topic not found", status_code=404)
        
        # For batch-level users, enforce batch scope
        if request_user.get("role") == "batch":
            if topic.get("batch_id") != request_user.get("batch_id"):
                return error_response("FORBIDDEN", "Topic not found in your batch", status_code=403)
        
        return success_response({"topic": topic})
    
    @staticmethod
    def update_topic(request_user, topic_id, data):
        """
        Update a topic (enforces role-based access).
        
        Args:
            request_user (dict): Authenticated user data
            topic_id (str): Topic ID
            data (dict): Update data
            
        Returns:
            tuple: (response, status_code)
        """
        topic = TopicModel().get(topic_id)
        
        if not topic:
            return error_response("NOT_FOUND", "Topic not found", status_code=404)
        
        # Batch-level users can only update their own batch's topics
        if request_user.get("role") == "batch":
            if topic.get("batch_id") != request_user.get("batch_id"):
                return error_response("FORBIDDEN", "Cannot update topic outside your batch", status_code=403)
        
        # Validate if topic_name is being updated
        if "topic_name" in data and data["topic_name"]:
            if len(str(data["topic_name"]).strip()) < 2:
                return error_response("INVALID_INPUT", "Topic name must be at least 2 characters", status_code=400)
        
        try:
            update_data = {}
            if "topic_name" in data and data["topic_name"]:
                update_data["topic_name"] = data["topic_name"].strip()
            
            TopicModel().update(topic_id, update_data)
            
            # Audit log
            audit_log(request_user.get("uid"), "update_topic", "topic", topic_id, update_data)
            
            return success_response(None, "Topic updated successfully")
        except Exception as e:
            return error_response("UPDATE_ERROR", str(e), status_code=500)
    
    @staticmethod
    def delete_topic(request_user, topic_id):
        """
        Delete a topic (soft delete via is_disabled flag).
        
        Args:
            request_user (dict): Authenticated user data
            topic_id (str): Topic ID
            
        Returns:
            tuple: (response, status_code)
        """
        topic = TopicModel().get(topic_id)
        
        if not topic:
            return error_response("NOT_FOUND", "Topic not found", status_code=404)
        
        # Batch-level users can only delete their own batch's topics
        if request_user.get("role") == "batch":
            if topic.get("batch_id") != request_user.get("batch_id"):
                return error_response("FORBIDDEN", "Cannot delete topic outside your batch", status_code=403)
        
        try:
            TopicModel().delete(topic_id)
            
            # Audit log
            audit_log(request_user.get("uid"), "delete_topic", "topic", topic_id, {})
            
            return success_response(None, "Topic deleted successfully")
        except Exception as e:
            return error_response("DELETE_ERROR", str(e), status_code=500)
