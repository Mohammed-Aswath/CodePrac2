"""Firestore models and database helpers."""
from firebase_init import get_db
from datetime import datetime
import uuid


class FirestoreModel:
    """Base model for Firestore operations."""
    
    def __init__(self, collection_name):
        self.collection_name = collection_name
        self.db = get_db()
    
    def create(self, data):
        """Create document."""
        doc_id = str(uuid.uuid4())
        data["created_at"] = datetime.utcnow()
        self.db.collection(self.collection_name).document(doc_id).set(data)
        return doc_id
    
    def get(self, doc_id):
        """Get document by ID."""
        doc = self.db.collection(self.collection_name).document(doc_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id  # Add the document ID to the data
            return data
        return None
    
    def update(self, doc_id, data):
        """Update document."""
        self.db.collection(self.collection_name).document(doc_id).update(data)
    
    def delete(self, doc_id):
        """Soft delete by setting is_disabled=true."""
        self.db.collection(self.collection_name).document(doc_id).update({"is_disabled": True})
    
    def enable(self, doc_id):
        """Enable by setting is_disabled=false."""
        self.db.collection(self.collection_name).document(doc_id).update({"is_disabled": False})
    
    def query(self, **filters):
        """Query documents by filters."""
        query = self.db.collection(self.collection_name)
        for key, value in filters.items():
            query = query.where(key, "==", value)
        return [doc.to_dict() | {"id": doc.id} for doc in query.stream()]

    def hard_delete(self, doc_id):
        """Permanently delete a document from the collection."""
        self.db.collection(self.collection_name).document(doc_id).delete()
    
    def query_disabled(self, **filters):
        """Query documents excluding disabled ones."""
        filters["is_disabled"] = False
        return self.query(**filters)


class CollegeModel(FirestoreModel):
    """College model."""
    
    def __init__(self):
        super().__init__("colleges")


class DepartmentModel(FirestoreModel):
    """Department model."""
    
    def __init__(self):
        super().__init__("departments")


class BatchModel(FirestoreModel):
    """Batch model."""
    
    def __init__(self):
        super().__init__("batches")


class StudentModel(FirestoreModel):
    """Student model."""
    
    def __init__(self):
        super().__init__("students")


class TopicModel(FirestoreModel):
    """Topic model."""
    
    def __init__(self):
        super().__init__("topics")


class QuestionModel(FirestoreModel):
    """Question model."""
    
    def __init__(self):
        super().__init__("questions")


class NoteModel(FirestoreModel):
    """Note model."""
    
    def __init__(self):
        super().__init__("notes")


class PerformanceModel(FirestoreModel):
    """Performance model."""
    
    def __init__(self):
        super().__init__("performance")


class AuditLogModel(FirestoreModel):
    """Audit log model."""
    
    def __init__(self):
        super().__init__("audit_logs")


# Utility functions for role-based access validation

def is_college_disabled(college_id):
    """Check if college is disabled."""
    college = CollegeModel().get(college_id)
    return college and college.get("is_disabled", False)


def is_department_disabled(department_id):
    """Check if department is disabled."""
    dept = DepartmentModel().get(department_id)
    return dept and dept.get("is_disabled", False)


def is_batch_disabled(batch_id):
    """Check if batch is disabled."""
    batch = BatchModel().get(batch_id)
    return batch and batch.get("is_disabled", False)


def is_student_disabled(student_id):
    """Check if student is disabled."""
    student = StudentModel().get(student_id)
    return student and student.get("is_disabled", False)


def can_student_access(student_id):
    """Check if student can access platform (not disabled at any level)."""
    student = StudentModel().get(student_id)
    if not student or student.get("is_disabled", False):
        return False
    
    batch_id = student.get("batch_id")
    if is_batch_disabled(batch_id):
        return False
    
    batch = BatchModel().get(batch_id)
    dept_id = batch.get("department_id")
    if is_department_disabled(dept_id):
        return False
    
    dept = DepartmentModel().get(dept_id)
    college_id = dept.get("college_id")
    if is_college_disabled(college_id):
        return False
    
    return True


# Cascading disable/enable functions

def disable_college_cascade(college_id):
    """Disable a college and all its departments, batches, and students."""
    from auth import disable_user_firebase
    
    # Disable the college
    college = CollegeModel().get(college_id)
    if not college:
        return False
    
    CollegeModel().delete(college_id)
    if college.get("firebase_uid"):
        disable_user_firebase(college.get("firebase_uid"))
    
    # Disable all departments in this college
    depts = DepartmentModel().query(college_id=college_id, is_disabled=False)
    for dept in depts:
        DepartmentModel().delete(dept["id"])
        if dept.get("firebase_uid"):
            disable_user_firebase(dept.get("firebase_uid"))
        
        # Disable all batches in this department
        batches = BatchModel().query(department_id=dept["id"], is_disabled=False)
        for batch in batches:
            BatchModel().delete(batch["id"])
            if batch.get("firebase_uid"):
                disable_user_firebase(batch.get("firebase_uid"))
            
            # Disable all students in this batch
            students = StudentModel().query(batch_id=batch["id"], is_disabled=False)
            for student in students:
                StudentModel().delete(student["id"])
                if student.get("firebase_uid"):
                    disable_user_firebase(student.get("firebase_uid"))
    
    return True


def disable_department_cascade(department_id):
    """Disable a department and all its batches and students."""
    from auth import disable_user_firebase
    
    # Disable the department
    dept = DepartmentModel().get(department_id)
    if not dept:
        return False
    
    DepartmentModel().delete(department_id)
    if dept.get("firebase_uid"):
        disable_user_firebase(dept.get("firebase_uid"))
    
    # Disable all batches in this department
    batches = BatchModel().query(department_id=department_id, is_disabled=False)
    for batch in batches:
        BatchModel().delete(batch["id"])
        if batch.get("firebase_uid"):
            disable_user_firebase(batch.get("firebase_uid"))
        
        # Disable all students in this batch
        students = StudentModel().query(batch_id=batch["id"], is_disabled=False)
        for student in students:
            StudentModel().delete(student["id"])
            if student.get("firebase_uid"):
                disable_user_firebase(student.get("firebase_uid"))
    
    return True


def disable_batch_cascade(batch_id):
    """Disable a batch and all its students."""
    from auth import disable_user_firebase
    
    # Disable the batch
    batch = BatchModel().get(batch_id)
    if not batch:
        return False
    
    BatchModel().delete(batch_id)
    if batch.get("firebase_uid"):
        disable_user_firebase(batch.get("firebase_uid"))
    
    # Disable all students in this batch
    students = StudentModel().query(batch_id=batch_id, is_disabled=False)
    for student in students:
        StudentModel().delete(student["id"])
        if student.get("firebase_uid"):
            disable_user_firebase(student.get("firebase_uid"))
    
    return True


def enable_college_cascade(college_id):
    """Enable a college and all its departments, batches, and students."""
    from auth import enable_user_firebase
    
    # Enable the college
    college = CollegeModel().get(college_id)
    if not college:
        return False
    
    CollegeModel().enable(college_id)
    if college.get("firebase_uid"):
        enable_user_firebase(college.get("firebase_uid"))
    
    # Enable all departments in this college
    depts = DepartmentModel().query(college_id=college_id)
    for dept in depts:
        DepartmentModel().enable(dept["id"])
        if dept.get("firebase_uid"):
            enable_user_firebase(dept.get("firebase_uid"))
        
        # Enable all batches in this department
        batches = BatchModel().query(department_id=dept["id"])
        for batch in batches:
            BatchModel().enable(batch["id"])
            if batch.get("firebase_uid"):
                enable_user_firebase(batch.get("firebase_uid"))
            
            # Enable all students in this batch
            students = StudentModel().query(batch_id=batch["id"])
            for student in students:
                StudentModel().enable(student["id"])
                if student.get("firebase_uid"):
                    enable_user_firebase(student.get("firebase_uid"))
    
    return True


def enable_department_cascade(department_id):
    """Enable a department and all its batches and students."""
    from auth import enable_user_firebase
    
    # Enable the department
    dept = DepartmentModel().get(department_id)
    if not dept:
        return False
    
    DepartmentModel().enable(department_id)
    if dept.get("firebase_uid"):
        enable_user_firebase(dept.get("firebase_uid"))
    
    # Enable all batches in this department
    batches = BatchModel().query(department_id=department_id)
    for batch in batches:
        BatchModel().enable(batch["id"])
        if batch.get("firebase_uid"):
            enable_user_firebase(batch.get("firebase_uid"))
        
        # Enable all students in this batch
        students = StudentModel().query(batch_id=batch["id"])
        for student in students:
            StudentModel().enable(student["id"])
            if student.get("firebase_uid"):
                enable_user_firebase(student.get("firebase_uid"))
    
    return True


def enable_batch_cascade(batch_id):
    """Enable a batch and all its students."""
    from auth import enable_user_firebase
    
    # Enable the batch
    batch = BatchModel().get(batch_id)
    if not batch:
        return False
    
    BatchModel().enable(batch_id)
    if batch.get("firebase_uid"):
        enable_user_firebase(batch.get("firebase_uid"))
    
    # Enable all students in this batch
    students = StudentModel().query(batch_id=batch_id)
    for student in students:
        StudentModel().enable(student["id"])
        if student.get("firebase_uid"):
            enable_user_firebase(student.get("firebase_uid"))
    
    return True
