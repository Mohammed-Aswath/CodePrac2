import requests
import json

# Login
r = requests.post('http://localhost:5000/api/auth/login', 
                   json={'email': 'student1@codeprac.com', 'password': 'Student@123456'})
if r.status_code != 200:
    print(f"Login failed: {r.status_code}")
    print(r.json())
    exit(1)

token = r.json()['data']['token']
print("✓ Login successful")

# Test questions endpoint  
r = requests.get('http://localhost:5000/api/student/questions', 
                  headers={'Authorization': f'Bearer {token}'})
print(f"Questions endpoint: {r.status_code}")

if r.status_code == 200:
    data = r.json()
    if 'data' in data and 'questions' in data['data']:
        qs = data['data']['questions']
        print(f"✓ Found {len(qs)} questions")
        if qs:
            print(f"  First: {qs[0].get('title')}")
    else:
        print(f"Response: {json.dumps(data, indent=2)[:300]}")
else:
    print(f"Error: {json.dumps(r.json(), indent=2)}")
