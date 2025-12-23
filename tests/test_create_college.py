from app import app
from auth import create_jwt_token
import json


def run_test():
    token = create_jwt_token({
        "firebase_uid": "admin1",
        "uid": "admin1",
        "email": "admin@example.com",
        "role": "admin",
        "name": "Admin",
        "admin_id": "admin1"
    })

    with app.test_client() as c:
        r = c.post('/api/admin/colleges', headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}, data=json.dumps({'name':'Test University','email':'test.university@example.com'}))
        print('status', r.status_code)
        print(r.get_data(as_text=True))


if __name__ == '__main__':
    run_test()
