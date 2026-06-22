import requests

def test_get_admin_stats(base_url, admin_headers):
    response = requests.get(f"{base_url}/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    
    assert "revenue" in data
    assert "users" in data
    assert "workshops" in data
    assert "systemHealth" in data
    assert data["systemHealth"] == "OK"

def test_get_admin_transactions(base_url, admin_headers):
    response = requests.get(f"{base_url}/admin/transactions", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_admin_users(base_url, admin_headers):
    response = requests.get(f"{base_url}/admin/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    # Ensure our current admin is in the list
    assert any(user.get("role") == "ADMIN" for user in data)

def test_unauthorized_admin_access(base_url, auth_headers):
    # Standard user attempting to access admin endpoints
    response = requests.get(f"{base_url}/admin/stats", headers=auth_headers)
    assert response.status_code in [401, 403]
