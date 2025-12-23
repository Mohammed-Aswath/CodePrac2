import json
from app import app
from auth import create_jwt_token

# Test college-scoped create flows (department, batch, student)

def test_college_create_flow(monkeypatch):
    storage = {'departments': {}, 'batches': {}, 'students': {}}

    def gen_id(prefix):
        # deterministic fake ids
        return f"{prefix}-1"

    class FakeDept:
        def create(self, data):
            did = gen_id('dep')
            storage['departments'][did] = data
            return did

        def get(self, did):
            return storage['departments'].get(did)

        def query(self, **filters):
            return [{**v, 'id': k} for k, v in storage['departments'].items()]

    class FakeBatch:
        def create(self, data):
            bid = gen_id('batch')
            storage['batches'][bid] = data
            return bid

        def get(self, bid):
            val = storage['batches'].get(bid)
            return (val and {**val, 'id': bid})

        def query(self, **filters):
            return [{**v, 'id': k} for k, v in storage['batches'].items()]

    class FakeStudent:
        def create(self, data):
            sid = gen_id('stu')
            storage['students'][sid] = data
            return sid

        def query(self, **filters):
            return [{**v, 'id': k} for k, v in storage['students'].items()]

    # Patch models and auth helper to avoid external calls
    monkeypatch.setattr('routes.college.DepartmentModel', lambda: FakeDept())
    monkeypatch.setattr('routes.college.BatchModel', lambda: FakeBatch())
    monkeypatch.setattr('routes.college.StudentModel', lambda: FakeStudent())
    monkeypatch.setattr('routes.college.register_user_firebase', lambda email, password, name=None, role=None: f"fuid-{email}")

    client = app.test_client()
    token = create_jwt_token({'role': 'college', 'college_id': 'col-1', 'uid': 'col-1', 'firebase_uid': 'col-1'})
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    # Create department
    rv = client.post('/api/college/departments', json={'name': 'CS', 'email': 'cs@c.edu', 'password': 'secret12'}, headers=headers)
    assert rv.status_code == 201
    dept_id = rv.get_json()['data']['department_id']

    # Create batch under department
    rv = client.post('/api/college/batches', json={'department_id': dept_id, 'batch_name': '2020-2024', 'email': 'batch@c.edu', 'password': 'secret12'}, headers=headers)
    assert rv.status_code == 201
    batch_id = rv.get_json()['data']['batch_id']

    # Create student under batch
    rv = client.post('/api/college/students', json={'batch_id': batch_id, 'username': 'user1', 'email': 'user1@c.edu', 'password': 'secret12'}, headers=headers)
    assert rv.status_code == 201

    # List students for batch
    rv = client.get(f'/api/college/students?batch_id={batch_id}', headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert len(data['data']['students']) == 1
