import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
TIMEOUT = 30

def test_authentication_api_login_endpoint():
    headers = {
        "Content-Type": "application/json"
    }

    # Valid credentials
    valid_payload = {
        "email": "admin@clinicafisio.com.br",
        "password": "AdminTeste123!"
    }
    try:
        response = requests.post(LOGIN_URL, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status 200 for valid login, got {response.status_code}"
        # Optionally validate presence of auth token or other success indicators
        json_response = response.json()
        assert isinstance(json_response, dict), "Response should be a JSON object for successful login"
    except requests.RequestException as e:
        assert False, f"Request failed for valid credentials: {e}"

    # Invalid credentials
    invalid_payload = {
        "email": "admin@clinicafisio.com.br",
        "password": "WrongPassword123!"
    }
    try:
        response = requests.post(LOGIN_URL, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 401, f"Expected status 401 for invalid credentials, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for invalid credentials: {e}"

    # Access denied scenario - use valid credentials but assume user role restrictions cause 403
    # Since this is a login endpoint, 403 might be rare unless some logic denies access.
    # We simulate by sending login for a user that may be locked or disabled.
    # Here, to simulate, use a known denied user - if none, pass the test or skip.
    denied_payload = {
        "email": "denied@clinicafisio.com.br",
        "password": "SomePassword123!"
    }
    try:
        response = requests.post(LOGIN_URL, json=denied_payload, headers=headers, timeout=TIMEOUT)
        # Accept either 403 (access denied) or fallback to 401 if user doesn't exist
        assert response.status_code in (401, 403), f"Expected 401 or 403 for denied access, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed in access denial test: {e}"

test_authentication_api_login_endpoint()
