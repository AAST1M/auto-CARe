import requests

def test_create_workshop(base_url, workshop_headers):
    payload = {
        "name": "Auto Master Garage",
        "address": "Cairo, Egypt",
        "services": ["Oil Change", "Brakes"],
        "hours": "9 AM - 5 PM",
        "description": "Best garage"
    }
    response = requests.post(f"{base_url}/workshops", json=payload, headers=workshop_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"]

def test_get_workshops(base_url, auth_headers):
    response = requests.get(f"{base_url}/workshops", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_create_appointment(base_url, auth_headers, workshop_headers):
    # 1. Create a workshop first
    payload = {
        "name": "Appt Garage",
        "address": "Giza",
        "services": ["Oil Change"],
        "hours": "9 AM - 5 PM",
        "description": "Appt garage"
    }
    ws_res = requests.post(f"{base_url}/workshops", json=payload, headers=workshop_headers)
    assert ws_res.status_code == 200
    workshop_id = ws_res.json()["id"]

    # 2. Book appointment as standard user
    appt_payload = {
        "serviceType": "Oil Change",
        "time": "2030-01-01T10:00:00Z",
        "carDetails": "Toyota Corolla",
        "price": 250,
        "paymentMethod": "cash"
    }
    response = requests.post(f"{base_url}/workshops/{workshop_id}/book", json=appt_payload, headers=auth_headers)
    assert response.status_code == 200
    
    # 3. Verify user appointments
    user_appts_res = requests.get(f"{base_url}/auth/me", headers=auth_headers)
    assert user_appts_res.status_code == 200
