from app import app
from auth import create_jwt_token


def test_college_delete(monkeypatch):
    storage = {"colleges": {}}

    class FakeCollege:
        def create(self, data):
            cid = 'col-1'
            storage['colleges'][cid] = data
            return cid
        def get(self, cid):
            val = storage['colleges'].get(cid)
            return (val and {**val, 'id': cid})
        def query(self, **filters):
            return [{**v, 'id': k} for k, v in storage['colleges'].items()]
        def hard_delete(self, cid):
            if cid in storage['colleges']:
                del storage['colleges'][cid]

    monkeypatch.setattr('routes.admin.CollegeModel', lambda: FakeCollege())

    client = app.test_client()
    token = create_jwt_token({'role': 'admin', 'admin_id': 'admin-1'})
    headers = {'Authorization': f'Bearer {token}'}

    # Create a college via the model directly
    cid = FakeCollege().create({'name': 'X', 'email': 'x@test'})

    # Verify it's present
    rv = client.get('/api/admin/colleges', headers=headers)
    assert rv.status_code == 200
    data = rv.get_json()
    assert len(data['data']['colleges']) == 1

    # Delete
    rv = client.delete(f'/api/admin/colleges/{cid}', headers=headers)
    assert rv.status_code == 200

    # List should be empty now
    rv = client.get('/api/admin/colleges', headers=headers)
    data = rv.get_json()
    assert len(data['data']['colleges']) == 0
