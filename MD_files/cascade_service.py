"""Cascading delete service for hierarchical entities."""
from models import (
    CollegeModel, DepartmentModel, BatchModel, StudentModel,
    QuestionModel, NoteModel, PerformanceModel
)
from auth import disable_user_firebase
from utils import audit_log


class CascadeService:
    """Service for cascading deletes across entity hierarchy."""

    @staticmethod
    def delete_college_cascade(college_id, user_id):
        """
        Delete a college and all its dependencies:
        - All departments in the college
        - All batches in those departments
        - All students in those batches
        - All questions for those batches
        - All notes for those students
        - All performance records for those students
        """
        college = CollegeModel().get(college_id)
        if not college:
            return False, "College not found"

        # Get all departments in this college
        departments = DepartmentModel().query(college_id=college_id)
        
        deleted_count = {
            "college": 0,
            "departments": 0,
            "batches": 0,
            "students": 0,
            "questions": 0,
            "notes": 0,
            "performance": 0
        }

        # Delete all departments and their cascades
        for dept in departments:
            dept_id = dept.get("id")
            result = CascadeService.delete_department_cascade(dept_id, user_id, cascade_from_college=True)
            if result[0]:
                deleted_count["departments"] += 1
                deleted_count["batches"] += result[2].get("batches", 0)
                deleted_count["students"] += result[2].get("students", 0)
                deleted_count["questions"] += result[2].get("questions", 0)
                deleted_count["notes"] += result[2].get("notes", 0)
                deleted_count["performance"] += result[2].get("performance", 0)

        # Delete the college itself
        CollegeModel().hard_delete(college_id)
        deleted_count["college"] = 1
        
        # Disable Firebase user for college
        if college.get("firebase_uid"):
            disable_user_firebase(college.get("firebase_uid"))

        # Audit log
        audit_log(user_id, "delete_college_cascade", "college", college_id, 
                 {"deleted_count": deleted_count})

        return True, "College and all dependencies deleted successfully", deleted_count

    @staticmethod
    def delete_department_cascade(dept_id, user_id, cascade_from_college=False):
        """
        Delete a department and all its dependencies:
        - All batches in the department
        - All students in those batches
        - All questions for those batches
        - All notes for those students
        - All performance records for those students
        """
        dept = DepartmentModel().get(dept_id)
        if not dept:
            return False, "Department not found", {}

        # Get all batches in this department
        batches = BatchModel().query(department_id=dept_id)
        
        deleted_count = {
            "department": 0,
            "batches": 0,
            "students": 0,
            "questions": 0,
            "notes": 0,
            "performance": 0
        }

        # Delete all batches and their cascades
        for batch in batches:
            batch_id = batch.get("id")
            result = CascadeService.delete_batch_cascade(batch_id, user_id, cascade_from_dept=True)
            if result[0]:
                deleted_count["batches"] += 1
                deleted_count["students"] += result[2].get("students", 0)
                deleted_count["questions"] += result[2].get("questions", 0)
                deleted_count["notes"] += result[2].get("notes", 0)
                deleted_count["performance"] += result[2].get("performance", 0)

        # Delete the department itself (only if not cascading from college)
        if not cascade_from_college:
            DepartmentModel().hard_delete(dept_id)
            deleted_count["department"] = 1
            
            # Disable Firebase user for department
            if dept.get("firebase_uid"):
                disable_user_firebase(dept.get("firebase_uid"))
            
            # Audit log
            audit_log(user_id, "delete_department_cascade", "department", dept_id, 
                     {"deleted_count": deleted_count})
        else:
            # Still mark as deleted but don't audit separately
            DepartmentModel().hard_delete(dept_id)
            if dept.get("firebase_uid"):
                disable_user_firebase(dept.get("firebase_uid"))

        return True, "Department and all dependencies deleted successfully", deleted_count

    @staticmethod
    def delete_batch_cascade(batch_id, user_id, cascade_from_dept=False):
        """
        Delete a batch and all its dependencies:
        - All students in the batch
        - All questions for the batch
        - All notes for those students
        - All performance records for those students
        """
        batch = BatchModel().get(batch_id)
        if not batch:
            return False, "Batch not found", {}

        # Get all students in this batch
        students = StudentModel().query(batch_id=batch_id)
        
        # Get all questions for this batch
        questions = QuestionModel().query(batch_id=batch_id)
        
        deleted_count = {
            "batch": 0,
            "students": 0,
            "questions": 0,
            "notes": 0,
            "performance": 0
        }

        # Delete all students and their related records
        for student in students:
            student_id = student.get("id")
            
            # Delete notes for this student
            notes = NoteModel().query(student_id=student_id)
            for note in notes:
                NoteModel().hard_delete(note.get("id"))
                deleted_count["notes"] += 1
            
            # Delete performance records for this student
            performance_records = PerformanceModel().query(student_id=student_id)
            for perf in performance_records:
                PerformanceModel().hard_delete(perf.get("id"))
                deleted_count["performance"] += 1
            
            # Delete the student
            StudentModel().hard_delete(student_id)
            deleted_count["students"] += 1
            
            # Disable Firebase user for student
            if student.get("firebase_uid"):
                disable_user_firebase(student.get("firebase_uid"))

        # Delete all questions for this batch
        for question in questions:
            QuestionModel().hard_delete(question.get("id"))
            deleted_count["questions"] += 1

        # Delete the batch itself (only if not cascading from department)
        if not cascade_from_dept:
            BatchModel().hard_delete(batch_id)
            deleted_count["batch"] = 1
            
            # Disable Firebase user for batch
            if batch.get("firebase_uid"):
                disable_user_firebase(batch.get("firebase_uid"))
            
            # Audit log
            audit_log(user_id, "delete_batch_cascade", "batch", batch_id, 
                     {"deleted_count": deleted_count})
        else:
            # Still mark as deleted but don't audit separately
            BatchModel().hard_delete(batch_id)
            if batch.get("firebase_uid"):
                disable_user_firebase(batch.get("firebase_uid"))

        return True, "Batch and all dependencies deleted successfully", deleted_count

    @staticmethod
    def delete_student_cascade(student_id, user_id):
        """
        Delete a student and all their related records:
        - All notes
        - All performance records
        """
        student = StudentModel().get(student_id)
        if not student:
            return False, "Student not found", {}

        deleted_count = {
            "student": 0,
            "notes": 0,
            "performance": 0
        }

        # Delete all notes for this student
        notes = NoteModel().query(student_id=student_id)
        for note in notes:
            NoteModel().hard_delete(note.get("id"))
            deleted_count["notes"] += 1

        # Delete all performance records for this student
        performance_records = PerformanceModel().query(student_id=student_id)
        for perf in performance_records:
            PerformanceModel().hard_delete(perf.get("id"))
            deleted_count["performance"] += 1

        # Delete the student
        StudentModel().hard_delete(student_id)
        deleted_count["student"] = 1

        # Disable Firebase user for student
        if student.get("firebase_uid"):
            disable_user_firebase(student.get("firebase_uid"))

        # Audit log
        audit_log(user_id, "delete_student_cascade", "student", student_id, 
                 {"deleted_count": deleted_count})

        return True, "Student and all related records deleted successfully", deleted_count
