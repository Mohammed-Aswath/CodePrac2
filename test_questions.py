#!/usr/bin/env python
"""Test student questions endpoint."""
import subprocess
import time
import requests
import json

# Kill any existing Flask processes
print("Killing existing Flask processes...")
subprocess.run("taskkill /F /IM python.exe", shell=True, capture_output=True)
time.sleep(2)

# Start Flask in background
print("Starting Flask app...")
proc = subprocess.Popen(["python", "app.py"], cwd="d:\\PRJJ")
time.sleep(3)

try:
    print("\nTest 1: Health check")
    r = requests.get('http://localhost:5000/health')
    print(f"Status: {r.status_code}")
    
    print("\nTest 2: Student questions (no auth)")
    r = requests.get('http://localhost:5000/api/student/questions')
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    
finally:
    proc.terminate()
    proc.wait()
