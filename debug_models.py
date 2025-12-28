import sys
import os
import logging
from datetime import datetime

# Add current directory to path to allow imports
sys.path.append(os.getcwd())

# Mock configuration if needed or rely on existing
try:
    # Just import get_db, initialization happens on import
    from firebase_init import get_db
    from models import StudentModel, PerformanceModel, BatchModel
    
    db = get_db()
    print("✓ Firebase initialized")
    
    # 1. List all Students
    print("\n--- STUDENTS ---")
    students = StudentModel().query()
    
    target_student = None
    if students:
        # Try to pick one with performance data in mind if possible, or just the first one
        # Let's check for 'Vikram' or just the first one
        target_student = students[0]
        for s in students:
            # print(f"- {s.get('username')} ({s.get('id')})")
            if "Vikram" in s.get("username", "") or "Vikram" in s.get("name", ""):
                 target_student = s
                 
    if target_student:
        print(f"\nTargeting Student: {target_student.get('username')}") 
        print(f"UUID (Student ID): {target_student.get('id')}")
        print(f"Firebase UID:      {target_student.get('firebase_uid')}")
        
        # 2. Check Performance for this student
        print(f"\n--- PERFORMANCE ---")
        p_model = PerformanceModel()
        
        # A. Query by UUID
        perfs_uuid = p_model.query(student_id=target_student.get('id'))
        print(f"Records with student_id = UUID: {len(perfs_uuid)}")
        
        # B. Query by Firebase UID
        perfs_uid = p_model.query(student_id=target_student.get('firebase_uid'))
        print(f"Records with student_id = Firebase UID: {len(perfs_uid)}")
        
        # C. Query by 'uid' field if it exists?
        # Maybe the field name is 'uid' not 'student_id'?
        perfs_uid_field = p_model.query(uid=target_student.get('firebase_uid'))
        print(f"Records with uid = Firebase UID: {len(perfs_uid_field)}")

    else:
        print("No students found")
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
