import requests

def test_user_registration(base_url, random_email):
    payload = {
        "name": "Register Test User",
        "email": random_email,
        "password": "Password123!",
        "role": "USER"
    }
    response = requests.post(f"{base_url}/auth/register", json=payload)
    assert response.status_code in [200, 201]
    
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == random_email

def test_duplicate_registration_fails(base_url, random_email):
    payload = {
        "name": "Register Test User",
        "email": random_email,
        "password": "Password123!",
        "role": "USER"
    }
    # First registration
    requests.post(f"{base_url}/auth/register", json=payload)
    # Second registration should fail
    response2 = requests.post(f"{base_url}/auth/register", json=payload)
    assert response2.status_code == 400

def test_user_login(base_url, random_email):
    payload = {
        "name": "Login Test User",
        "email": random_email,
        "password": "Password123!",
        "role": "USER"
    }
    requests.post(f"{base_url}/auth/register", json=payload)
    
    login_payload = {
        "email": random_email,
        "password": "Password123!"
    }
    response = requests.post(f"{base_url}/auth/login", json=login_payload)
    assert response.status_code == 200
    assert "token" in response.json()

def test_fetch_profile(base_url, auth_headers):
    response = requests.get(f"{base_url}/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["role"] == "USER"
