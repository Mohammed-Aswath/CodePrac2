"""
Seed script to populate Firestore with test data.
This creates test users, colleges, departments, batches, and questions.
"""

import sys
from datetime import datetime
from firebase_init import db, get_auth
import firebase_admin
from firebase_admin import auth as firebase_auth

# Test data configuration
TEST_USERS = [
    {
        "email": "admin@codeprac.com",
        "password": "Admin@123456",
        "name": "Admin User",
        "role": "admin"
    },
    {
        "email": "college@codeprac.com",
        "password": "College@123456",
        "name": "College Admin",
        "role": "college",
        "college_name": "Tech Institute"
    },
    {
        "email": "dept@codeprac.com",
        "password": "Department@123456",
        "name": "Department Head",
        "role": "department",
        "college_id": None,  # Will be set after college creation
        "department_name": "Computer Science"
    },
    {
        "email": "student1@codeprac.com",
        "password": "Student@123456",
        "name": "John Doe",
        "role": "student",
        "college_id": None,
        "department_id": None,
        "batch_id": None
    },
    {
        "email": "student2@codeprac.com",
        "password": "Student@123456",
        "name": "Jane Smith",
        "role": "student",
        "college_id": None,
        "department_id": None,
        "batch_id": None
    }
]

COLLEGES = [
    {
        "name": "Tech Institute",
        "email": "admin@techinstitute.edu",
        "is_disabled": False
    },
    {
        "name": "Engineering University",
        "email": "admin@enguni.edu",
        "is_disabled": False
    }
]

TOPICS = [
    {
        "name": "Array & Strings",
        "description": "Master array manipulation and string operations"
    },
    {
        "name": "Sorting & Searching",
        "description": "Learn sorting algorithms and binary search techniques"
    },
    {
        "name": "Graph Algorithms",
        "description": "Explore BFS, DFS, and shortest path algorithms"
    },
    {
        "name": "Dynamic Programming",
        "description": "Solve optimization problems with DP"
    },
    {
        "name": "Linked List",
        "description": "Master linked list operations and manipulation"
    }
]

SAMPLE_QUESTIONS = [
    {
        "title": "Two Sum",
        "description": """Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.
You may assume each input has exactly one solution, and you cannot use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] == 9, so we return [0, 1].""",
        "difficulty": "easy",
        "topic": "Array & Strings",
        "sample_input": "[2,7,11,15]\n9",
        "sample_output": "[0,1]",
        "open_testcases": [
            {"input": "nums = [2,7,11,15], target = 9", "expected_output": "[0,1]"},
            {"input": "nums = [3,2,4], target = 6", "expected_output": "[1,2]"}
        ]
    },
    {
        "title": "Reverse String",
        "description": """Write a function that reverses a string. The input string is given as an array of characters s.

You must do this in-place with O(1) extra memory.

Example:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]""",
        "difficulty": "easy",
        "topic": "Array & Strings",
        "sample_input": "[\"h\",\"e\",\"l\",\"l\",\"o\"]",
        "sample_output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]",
        "open_testcases": [
            {"input": "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]", "expected_output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]"},
            {"input": "s = [\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", "expected_output": "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]"}
        ]
    },
    {
        "title": "Merge Sorted Array",
        "description": """You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of valid elements in nums1 and nums2 respectively.

Merge nums2 into nums1 as one sorted array in-place.

Example:
Input: nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
Output: [1,2,2,3,5,6]""",
        "difficulty": "easy",
        "topic": "Sorting & Searching",
        "sample_input": "[1,2,3,0,0,0]\n3\n[2,5,6]\n3",
        "sample_output": "[1,2,2,3,5,6]",
        "open_testcases": [
            {"input": "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3", "expected_output": "[1,2,2,3,5,6]"},
            {"input": "nums1 = [1], m = 1, nums2 = [], n = 0", "expected_output": "[1]"}
        ]
    },
    {
        "title": "Valid Parentheses",
        "description": """Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

Example:
Input: s = "()"
Output: true""",
        "difficulty": "medium",
        "topic": "Array & Strings",
        "sample_input": "\"()\"",
        "sample_output": "true",
        "open_testcases": [
            {"input": "s = \"()\"", "expected_output": "true"},
            {"input": "s = \"(){}[]\"", "expected_output": "true"},
            {"input": "s = \"(]\"", "expected_output": "false"}
        ]
    },
    {
        "title": "Binary Search",
        "description": """Given a sorted array nums of n elements and a target value target, write a function to search for target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

Example:
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4""",
        "difficulty": "medium",
        "topic": "Sorting & Searching",
        "sample_input": "[-1,0,3,5,9,12]\n9",
        "sample_output": "4",
        "open_testcases": [
            {"input": "nums = [-1,0,3,5,9,12], target = 9", "expected_output": "4"},
            {"input": "nums = [-1,0,3,5,9,12], target = 13", "expected_output": "-1"}
        ]
    }
]

def create_firebase_user(email, password, name, role):
    """Create a user in Firebase Authentication."""
    try:
        user = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=name,
            disabled=False
        )
        print(f"✓ Created Firebase user: {email} (UID: {user.uid})")
        return user.uid
    except firebase_auth.EmailAlreadyExistsError:
        print(f"⚠ User already exists: {email}")
        # Get the user UID
        users = firebase_auth.list_users()
        for user in users.iterate_all():
            if user.email == email:
                return user.uid
    except Exception as e:
        print(f"✗ Error creating user {email}: {e}")
        return None

def seed_users():
    """Create test users in Firestore."""
    print("\n📝 Seeding Users...")
    user_ids = {}
    
    for user_data in TEST_USERS:
        email = user_data["email"]
        password = user_data["password"]
        name = user_data["name"]
        role = user_data["role"]
        
        # Create Firebase auth user
        uid = create_firebase_user(email, password, name, role)
        if not uid:
            continue
        
        user_ids[role] = uid
        
        # Create Firestore user document
        user_doc = {
            "uid": uid,
            "email": email,
            "name": name,
            "role": role,
            "is_disabled": False,
            "created_at": datetime.utcnow()
        }
        
        # Add role-specific fields
        if role == "college":
            user_doc["college_name"] = user_data.get("college_name")
        elif role == "department":
            user_doc["department_name"] = user_data.get("department_name")
        
        try:
            db.collection("User").document(uid).set(user_doc)
            print(f"✓ Created Firestore user: {email}")
        except Exception as e:
            print(f"✗ Error saving user to Firestore: {e}")
    
    return user_ids

def seed_colleges():
    """Create test colleges."""
    print("\n🏫 Seeding Colleges...")
    college_ids = []
    
    for college_data in COLLEGES:
        try:
            college_doc = {
                "name": college_data["name"],
                "email": college_data["email"],
                "is_disabled": college_data["is_disabled"],
                "created_at": datetime.utcnow()
            }
            
            doc_ref = db.collection("College").add(college_doc)
            college_id = doc_ref[1].id
            college_ids.append(college_id)
            print(f"✓ Created college: {college_data['name']} (ID: {college_id})")
        except Exception as e:
            print(f"✗ Error creating college: {e}")
    
    return college_ids

def seed_departments(college_ids):
    """Create test departments."""
    print("\n🏢 Seeding Departments...")
    dept_ids = []
    
    departments = [
        {
            "name": "Computer Science",
            "email": "cs@techinstitute.edu",
            "college_id": college_ids[0] if college_ids else None
        },
        {
            "name": "Information Technology",
            "email": "it@techinstitute.edu",
            "college_id": college_ids[0] if college_ids else None
        },
        {
            "name": "Electronics",
            "email": "ec@enguni.edu",
            "college_id": college_ids[1] if len(college_ids) > 1 else college_ids[0]
        }
    ]
    
    for dept_data in departments:
        if not dept_data["college_id"]:
            continue
        
        try:
            dept_doc = {
                "name": dept_data["name"],
                "email": dept_data["email"],
                "college_id": dept_data["college_id"],
                "is_disabled": False,
                "created_at": datetime.utcnow()
            }
            
            doc_ref = db.collection("Department").add(dept_doc)
            dept_id = doc_ref[1].id
            dept_ids.append(dept_id)
            print(f"✓ Created department: {dept_data['name']} (ID: {dept_id})")
        except Exception as e:
            print(f"✗ Error creating department: {e}")
    
    return dept_ids

def seed_batches(dept_ids):
    """Create test batches."""
    print("\n👥 Seeding Batches...")
    batch_ids = []
    
    batches = [
        {"name": "2024-Batch", "department_id": dept_ids[0] if dept_ids else None, "year": 2024},
        {"name": "2025-Batch", "department_id": dept_ids[1] if len(dept_ids) > 1 else (dept_ids[0] if dept_ids else None), "year": 2025}
    ]
    
    for batch_data in batches:
        if not batch_data["department_id"]:
            continue
        
        try:
            batch_doc = {
                "name": batch_data["name"],
                "department_id": batch_data["department_id"],
                "year": batch_data["year"],
                "is_disabled": False,
                "created_at": datetime.utcnow()
            }
            
            doc_ref = db.collection("Batch").add(batch_doc)
            batch_id = doc_ref[1].id
            batch_ids.append(batch_id)
            print(f"✓ Created batch: {batch_data['name']} (ID: {batch_id})")
        except Exception as e:
            print(f"✗ Error creating batch: {e}")
    
    return batch_ids

def seed_topics(dept_ids):
    """Create test topics."""
    print("\n📚 Seeding Topics...")
    topic_ids = {}
    
    for topic_data in TOPICS:
        if not dept_ids:
            continue
        
        try:
            topic_doc = {
                "name": topic_data["name"],
                "description": topic_data["description"],
                "department_id": dept_ids[0],
                "is_disabled": False,
                "created_at": datetime.utcnow()
            }
            
            doc_ref = db.collection("Topic").add(topic_doc)
            topic_id = doc_ref[1].id
            topic_ids[topic_data["name"]] = topic_id
            print(f"✓ Created topic: {topic_data['name']} (ID: {topic_id})")
        except Exception as e:
            print(f"✗ Error creating topic: {e}")
    
    return topic_ids

def seed_questions(dept_ids, batch_ids, topic_ids):
    """Create test questions."""
    print("\n❓ Seeding Questions...")
    question_count = 0
    
    if not dept_ids or not batch_ids:
        print("⚠ Skipping questions: missing departments or batches")
        return
    
    for question_data in SAMPLE_QUESTIONS:
        try:
            topic_id = topic_ids.get(question_data["topic"])
            if not topic_id:
                print(f"⚠ Skipping question: topic not found for {question_data['title']}")
                continue
            
            question_doc = {
                "title": question_data["title"],
                "description": question_data["description"],
                "difficulty": question_data["difficulty"],
                "topic_id": topic_id,
                "batch_id": batch_ids[0],
                "department_id": dept_ids[0],
                "sample_input": question_data["sample_input"],
                "sample_output": question_data["sample_output"],
                "open_testcases": question_data["open_testcases"],
                "hidden_testcases": [],
                "is_disabled": False,
                "created_at": datetime.utcnow()
            }
            
            doc_ref = db.collection("Question").add(question_doc)
            question_id = doc_ref[1].id
            question_count += 1
            print(f"✓ Created question: {question_data['title']} (ID: {question_id})")
        except Exception as e:
            print(f"✗ Error creating question: {e}")
    
    print(f"✓ Total questions created: {question_count}")

def main():
    """Main seed function."""
    print("=" * 60)
    print("🌱 CODEPRAC 2.0 Firestore Seed Data")
    print("=" * 60)
    
    try:
        # Seed data
        user_ids = seed_users()
        college_ids = seed_colleges()
        dept_ids = seed_departments(college_ids)
        batch_ids = seed_batches(dept_ids)
        topic_ids = seed_topics(dept_ids)
        seed_questions(dept_ids, batch_ids, topic_ids)
        
        print("\n" + "=" * 60)
        print("✅ Seed data created successfully!")
        print("=" * 60)
        
        print("\n📋 Test User Credentials:")
        print("-" * 60)
        for user_data in TEST_USERS:
            print(f"Email: {user_data['email']}")
            print(f"Password: {user_data['password']}")
            print(f"Role: {user_data['role']}")
            print()
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
