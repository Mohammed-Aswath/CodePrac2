import json
from app import app
from auth import create_jwt_token

# We'll monkeypatch model methods to avoid real Firestore access

def test_batch_crud_flow(monkeypatch):
    # Fake storage
    storage = {
        "colleges": {},
        "departments": {},
        "batches": {}
    }

    # Fake ID generators
    def gen_id(prefix):
        return f"{prefix}-1"

    # Patch CollegeModel
    class FakeCollege:
        def create(self, data):
            cid = gen_id('col')
            storage['colleges'][cid] = data
            return cid
        def get(self, cid):
            return storage['colleges'].get(cid)

    # Patch DepartmentModel
    class FakeDept:
        def create(self, data):
            did = gen_id('dep')
            storage['departments'][did] = data
            return did
        def get(self, did):
            return storage['departments'].get(did)
        def query(self, **filters):
            return [ { **v, 'id': k } for k, v in storage['departments'].items() ]

    # Patch BatchModel
    class FakeBatch:
        def create(self, data):
            bid = gen_id('batch')
            storage['batches'][bid] = data
            return bid
        def get(self, bid):
            val = storage['batches'].get(bid)
            return (val and { **val, 'id': bid })
        def query(self, **filters):
            return [ { **v, 'id': k } for k, v in storage['batches'].items() ]
        def update(self, bid, data):
            if bid in storage['batches']:
                storage['batches'][bid].update(data)
        def delete(self, bid):
            if bid in storage['batches']:
                storage['batches'][bid]['is_disabled'] = True
        def enable(self, bid):
            if bid in storage['batches']:
                storage['batches'][bid]['is_disabled'] = False

    # Apply monkeypatches
    monkeypatch.setattr('routes.admin.CollegeModel', lambda: FakeCollege())
    monkeypatch.setattr('routes.admin.DepartmentModel', lambda: FakeDept())
    monkeypatch.setattr('routes.admin.BatchModel', lambda: FakeBatch())

    client = app.test_client()
    token = create_jwt_token({'role': 'admin', 'admin_id': 'admin-1'})
    headers = { 'Authorization': f'Bearer {token}' }

    # Create college
    rv = client.post('/api/admin/colleges', json={'name': 'Test College', 'email': 'c@test.edu'}, headers=headers)
    assert rv.status_code == 201
    data = rv.get_json()
    assert data['error'] is False
    college_id = data['data']['college_id']

    # Create department
    rv = client.post('/api/admin/departments', json={'college_id': college_id, 'name': 'CS', 'email': 'cs@test.edu'}, headers=headers)
    assert rv.status_code == 201
    data = rv.get_json()
    dept_id = data['data']['department_id']

    # Create batch
    rv = client.post('/api/admin/batches', json={'department_id': dept_id, 'college_id': college_id, 'batch_name': '2020-2024'}, headers=headers)
    assert rv.status_code == 201
    data = rv.get_json()
    batch_id = data['data']['batch_id']

    # List batches
    rv = client.get('/api/admin/batches', headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert len(data['data']['batches']) == 1

    # Update batch
    rv = client.put(f'/api/admin/batches/{batch_id}', json={'batch_name': '2021-2025'}, headers=headers)
    assert rv.status_code == 200

    # Get batch
    rv = client.get(f'/api/admin/batches/{batch_id}', headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert data['data']['batch']['batch_name'] == '2021-2025'

    # Disable
    rv = client.post(f'/api/admin/batches/{batch_id}/disable', headers=headers)
    assert rv.status_code == 200
    # Enable
    rv = client.post(f'/api/admin/batches/{batch_id}/enable', headers=headers)
    assert rv.status_code == 200
