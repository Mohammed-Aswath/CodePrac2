"""Quick test script to verify auth endpoints work."""
import requests
import json

BASE_URL = "http://localhost:5000/api"

# Test login with seed user
test_user = {
    "email": "student1@codeprac.com",
    "password": "Student@123456"
}

print("=" * 60)
print("Testing Auth Endpoints")
print("=" * 60)

print("\n1. Testing LOGIN endpoint...")
print(f"   POST {BASE_URL}/auth/login")
print(f"   Credentials: {test_user['email']}")

try:
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=test_user,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    data = response.json()
    
    if response.status_code == 200:
        print(f"   ✓ Login successful!")
        print(f"   Token: {data['token'][:50]}...")
        print(f"   User: {data['user']}")
        token = data['token']
    else:
        print(f"   ✗ Login failed: {data}")
        token = None
except Exception as e:
    print(f"   ✗ Error: {e}")
    token = None

print("\n2. Testing REGISTER endpoint...")
print(f"   POST {BASE_URL}/auth/register")

try:
    new_user = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "TestPass@123456",
        "role": "student"
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json=new_user,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    data = response.json()
    
    if response.status_code in [200, 201]:
        print(f"   ✓ Registration successful!")
        print(f"   User: {data['user']}")
    elif response.status_code == 409:
        print(f"   ⚠ Email already exists (expected if run multiple times)")
    else:
        print(f"   ✗ Registration failed: {data}")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n3. Testing VERIFY-TOKEN endpoint...")
if token:
    print(f"   POST {BASE_URL}/auth/verify-token")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/verify-token",
            json={"token": token},
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        data = response.json()
        
        if response.status_code == 200:
            print(f"   ✓ Token is valid!")
            print(f"   Payload: {data['payload']}")
        else:
            print(f"   ✗ Token verification failed: {data}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
else:
    print("   Skipped (no token from login)")

print("\n" + "=" * 60)
print("✓ Auth endpoint tests completed!")
print("=" * 60)
