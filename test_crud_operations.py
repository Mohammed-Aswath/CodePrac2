"""
Test script to validate all CRUD operations for Topics, Questions, and Notes
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000/api"
ADMIN_TOKEN = None
BATCH_TOKEN = None

# Test data
test_college = None
test_department = None
test_batch = None
test_topic = None
test_note = None

def register_and_login(email, password, role):
    """Register a user and login to get token"""
    # Try to register
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "name": f"Test {role.title()}",
        "email": email,
        "password": password,
        "role": role
    })
    print(f"Register {role}: {resp.status_code}")
    
    # Login
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    
    if resp.status_code == 200:
        data = resp.json()
        # Token could be in data.token or data.data.token
        token = data.get("data", {}).get("token") or data.get("token")
        if token:
            print(f"Login {role}: SUCCESS - Token: {token[:20]}...")
            return token
        else:
            print(f"Login {role}: No token found in response")
            return None
    else:
        print(f"Login {role}: FAILED - {resp.status_code}")
        return None

def setup_hierarchy():
    """Create test college, department, and batch"""
    global test_college, test_department, test_batch
    
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    # Create college
    resp = requests.post(f"{BASE_URL}/admin/colleges", json={
        "college_name": f"Test College {int(time.time())}"
    }, headers=headers)
    if resp.status_code == 201:
        test_college = resp.json().get("college_id")
        print(f"✓ College created: {test_college}")
    else:
        print(f"✗ College creation failed: {resp.text}")
        return False
    
    # Create department
    resp = requests.post(f"{BASE_URL}/admin/departments", json={
        "college_id": test_college,
        "department_name": f"Test Dept {int(time.time())}"
    }, headers=headers)
    if resp.status_code == 201:
        test_department = resp.json().get("department_id")
        print(f"✓ Department created: {test_department}")
    else:
        print(f"✗ Department creation failed: {resp.text}")
        return False
    
    # Create batch
    resp = requests.post(f"{BASE_URL}/admin/batches", json={
        "college_id": test_college,
        "department_id": test_department,
        "batch_name": f"Test Batch {int(time.time())}"
    }, headers=headers)
    if resp.status_code == 201:
        test_batch = resp.json().get("batch_id")
        print(f"✓ Batch created: {test_batch}")
    else:
        print(f"✗ Batch creation failed: {resp.text}")
        return False
    
    return True

def test_admin_topics():
    """Test Admin Panel Topic CRUD"""
    global test_topic
    print("\n" + "="*60)
    print("TESTING ADMIN TOPICS")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    # CREATE topic as admin
    print("\n1. CREATE Topic (Admin with hierarchy)")
    resp = requests.post(f"{BASE_URL}/admin/topics", json={
        "topic_name": f"Test Topic {int(time.time())}",
        "college_id": test_college,
        "department_id": test_department,
        "batch_id": test_batch
    }, headers=headers)
    if resp.status_code == 201:
        test_topic = resp.json().get("topic_id")
        print(f"✓ Topic created: {test_topic}")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # READ list of topics
    print("\n2. READ Topics List (Admin)")
    resp = requests.get(f"{BASE_URL}/admin/topics", headers=headers)
    if resp.status_code == 200:
        topics = resp.json().get("topics", [])
        print(f"✓ Retrieved {len(topics)} topics")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # READ single topic
    print("\n3. READ Single Topic (Admin)")
    resp = requests.get(f"{BASE_URL}/admin/topics/{test_topic}", headers=headers)
    if resp.status_code == 200:
        topic = resp.json().get("topic")
        print(f"✓ Retrieved topic: {topic.get('topic_name')}")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # UPDATE topic
    print("\n4. UPDATE Topic (Admin)")
    resp = requests.put(f"{BASE_URL}/admin/topics/{test_topic}", json={
        "topic_name": f"Updated Topic {int(time.time())}"
    }, headers=headers)
    if resp.status_code == 200:
        print(f"✓ Topic updated")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    return True

def test_batch_topics():
    """Test Batch Admin Topic CRUD"""
    print("\n" + "="*60)
    print("TESTING BATCH TOPICS")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {BATCH_TOKEN}"}
    batch_topic_id = None
    
    # CREATE topic as batch
    print("\n1. CREATE Topic (Batch - no hierarchy needed)")
    resp = requests.post(f"{BASE_URL}/batch/topics", json={
        "topic_name": f"Batch Topic {int(time.time())}"
    }, headers=headers)
    if resp.status_code == 201:
        batch_topic_id = resp.json().get("topic_id")
        print(f"✓ Topic created: {batch_topic_id}")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # READ list of topics
    print("\n2. READ Topics List (Batch)")
    resp = requests.get(f"{BASE_URL}/batch/topics", headers=headers)
    if resp.status_code == 200:
        topics = resp.json().get("topics", [])
        print(f"✓ Retrieved {len(topics)} topics")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # READ single topic
    print("\n3. READ Single Topic (Batch)")
    resp = requests.get(f"{BASE_URL}/batch/topics/{batch_topic_id}", headers=headers)
    if resp.status_code == 200:
        topic = resp.json().get("topic")
        print(f"✓ Retrieved topic: {topic.get('topic_name')}")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # UPDATE topic
    print("\n4. UPDATE Topic (Batch)")
    resp = requests.put(f"{BASE_URL}/batch/topics/{batch_topic_id}", json={
        "topic_name": f"Updated Batch Topic {int(time.time())}"
    }, headers=headers)
    if resp.status_code == 200:
        print(f"✓ Topic updated")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # DELETE topic
    print("\n5. DELETE Topic (Batch)")
    resp = requests.delete(f"{BASE_URL}/batch/topics/{batch_topic_id}", headers=headers)
    if resp.status_code == 200:
        print(f"✓ Topic deleted")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    return True

def test_admin_notes():
    """Test Admin Panel Note CRUD"""
    global test_note
    print("\n" + "="*60)
    print("TESTING ADMIN NOTES")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    # CREATE note as admin
    print("\n1. CREATE Note (Admin with hierarchy)")
    resp = requests.post(f"{BASE_URL}/admin/notes", json={
        "title": f"Test Note {int(time.time())}",
        "drive_link": "https://drive.google.com/file/d/test123/view",
        "college_id": test_college,
        "department_id": test_department,
        "batch_id": test_batch
    }, headers=headers)
    if resp.status_code == 201:
        test_note = resp.json().get("note_id")
        print(f"✓ Note created: {test_note}")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # READ list of notes
    print("\n2. READ Notes List (Admin)")
    resp = requests.get(f"{BASE_URL}/admin/notes", headers=headers)
    if resp.status_code == 200:
        notes = resp.json().get("notes", [])
        print(f"✓ Retrieved {len(notes)} notes")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # READ single note
    print("\n3. READ Single Note (Admin)")
    resp = requests.get(f"{BASE_URL}/admin/notes/{test_note}", headers=headers)
    if resp.status_code == 200:
        note = resp.json().get("note")
        print(f"✓ Retrieved note: {note.get('title')}")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # UPDATE note
    print("\n4. UPDATE Note (Admin)")
    resp = requests.put(f"{BASE_URL}/admin/notes/{test_note}", json={
        "title": f"Updated Note {int(time.time())}",
        "drive_link": "https://drive.google.com/file/d/updated123/view"
    }, headers=headers)
    if resp.status_code == 200:
        print(f"✓ Note updated")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    return True

def test_batch_notes():
    """Test Batch Admin Note CRUD"""
    print("\n" + "="*60)
    print("TESTING BATCH NOTES")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {BATCH_TOKEN}"}
    batch_note_id = None
    
    # CREATE note as batch
    print("\n1. CREATE Note (Batch - no hierarchy needed)")
    resp = requests.post(f"{BASE_URL}/batch/notes", json={
        "title": f"Batch Note {int(time.time())}",
        "drive_link": "https://drive.google.com/file/d/batch123/view"
    }, headers=headers)
    if resp.status_code == 201:
        batch_note_id = resp.json().get("note_id")
        print(f"✓ Note created: {batch_note_id}")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # READ list of notes
    print("\n2. READ Notes List (Batch)")
    resp = requests.get(f"{BASE_URL}/batch/notes", headers=headers)
    if resp.status_code == 200:
        notes = resp.json().get("notes", [])
        print(f"✓ Retrieved {len(notes)} notes")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # READ single note
    print("\n3. READ Single Note (Batch)")
    resp = requests.get(f"{BASE_URL}/batch/notes/{batch_note_id}", headers=headers)
    if resp.status_code == 200:
        note = resp.json().get("note")
        print(f"✓ Retrieved note: {note.get('title')}")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # UPDATE note
    print("\n4. UPDATE Note (Batch)")
    resp = requests.put(f"{BASE_URL}/batch/notes/{batch_note_id}", json={
        "title": f"Updated Batch Note {int(time.time())}",
        "drive_link": "https://drive.google.com/file/d/batch-updated/view"
    }, headers=headers)
    if resp.status_code == 200:
        print(f"✓ Note updated")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    # DELETE note
    print("\n5. DELETE Note (Batch)")
    resp = requests.delete(f"{BASE_URL}/batch/notes/{batch_note_id}", headers=headers)
    if resp.status_code == 200:
        print(f"✓ Note deleted")
    else:
        print(f"✗ Failed: {resp.status_code} - {resp.text}")
        return False
    
    return True

def main():
    """Run all tests"""
    global ADMIN_TOKEN, BATCH_TOKEN
    
    print("="*60)
    print("CRUD OPERATIONS TEST SUITE")
    print("="*60)
    
    # Setup
    print("\n" + "="*60)
    print("SETUP")
    print("="*60)
    
    ADMIN_TOKEN = register_and_login(f"admin{int(time.time())}@test.com", "password123", "admin")
    if not ADMIN_TOKEN:
        print("Failed to get admin token")
        return False
    
    BATCH_TOKEN = register_and_login(f"batch{int(time.time())}@test.com", "password123", "batch")
    if not BATCH_TOKEN:
        print("Failed to get batch token")
        return False
    
    if not setup_hierarchy():
        print("Failed to setup hierarchy")
        return False
    
    # Run tests
    results = []
    results.append(("Admin Topics CRUD", test_admin_topics()))
    results.append(("Batch Topics CRUD", test_batch_topics()))
    results.append(("Admin Notes CRUD", test_admin_notes()))
    results.append(("Batch Notes CRUD", test_batch_notes()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
