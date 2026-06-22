import pytest
import requests
import time
import random
import string

BASE_URL = "http://localhost:5001/api"

@pytest.fixture
def base_url():
    return BASE_URL

@pytest.fixture
def random_email():
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"pytester_{int(time.time())}_{random_str}@example.com"

@pytest.fixture
def auth_headers(random_email):
    """Registers a new standard user and returns auth headers with the bearer token."""
    payload = {
        "name": "Python Tester",
        "email": random_email,
        "password": "Password123!",
        "role": "USER"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    assert response.status_code in [200, 201]
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers():
    """Registers an ADMIN user and returns auth headers."""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    email = f"admin_{int(time.time())}_{random_str}@example.com"
    payload = {
        "name": "Admin Tester",
        "email": email,
        "password": "Password123!",
        "role": "ADMIN"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    assert response.status_code in [200, 201]
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def workshop_headers():
    """Registers a WORKSHOP_OWNER user and returns auth headers."""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    email = f"workshop_{int(time.time())}_{random_str}@example.com"
    payload = {
        "name": "Workshop Tester",
        "email": email,
        "password": "Password123!",
        "role": "WORKSHOP_OWNER"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    assert response.status_code in [200, 201]
    token = response.json().get("token")
    return {"Authorization": f"Bearer {token}"}
