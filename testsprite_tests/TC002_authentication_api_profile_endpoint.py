import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
PROFILE_ENDPOINT = f"{BASE_URL}/api/auth/profile"
TIMEOUT = 30

USERNAME = "admin@clinicafisio.com.br"
PASSWORD = "AdminTeste123!"


def test_auth_profile_endpoint():
    session = requests.Session()

    # Step 1: Login to check credentials
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        login_resp = session.post(LOGIN_ENDPOINT, json=login_payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"
    assert login_resp.status_code == 200, f"Expected 200 login, got {login_resp.status_code}"

    # Step 2: Access profile endpoint with session auth (cookies)
    try:
        profile_resp = session.get(PROFILE_ENDPOINT, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Authenticated profile request failed: {e}"
    assert profile_resp.status_code == 200, f"Expected 200 OK for authenticated profile, got {profile_resp.status_code}"
    try:
        profile_data = profile_resp.json()
    except Exception:
        assert False, "Profile response is not valid JSON"

    # Basic assertions on profile data (should contain email as a minimal check)
    assert isinstance(profile_data, dict), "Profile data is not a JSON object"
    assert "email" in profile_data, "Profile data does not contain 'email'"
    assert profile_data["email"].lower() == USERNAME.lower(), "Profile email does not match logged in user"

    # Step 3: Access profile endpoint without authentication
    try:
        profile_resp_unauth = requests.get(PROFILE_ENDPOINT, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Unauthenticated profile request failed: {e}"
    assert profile_resp_unauth.status_code == 401, (
        f"Expected 401 Unauthorized for unauthenticated profile request, got {profile_resp_unauth.status_code}"
    )


test_auth_profile_endpoint()
