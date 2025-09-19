import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_patients_management_api_list_patients_endpoint():
    headers = {
        "Accept": "application/json"
    }

    def get_json_or_assert(response):
        content_type = response.headers.get("Content-Type", "")
        assert "application/json" in content_type, f"Expected JSON response, got Content-Type: {content_type}"
        try:
            data = response.json()
        except Exception as e:
            assert False, f"Response is not valid JSON: {str(e)}"
        assert data is not None, "Response JSON is None"
        return data

    # Test 1: GET /api/patients no filters, default pagination (if any)
    response = requests.get(f"{BASE_URL}/api/patients", headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = get_json_or_assert(response)
    assert isinstance(data, list), "Response body should be a list"
    for patient in data:
        assert isinstance(patient, dict), "Each patient should be an object"
        for key in ["name", "cpf", "email", "phone"]:
            assert key in patient, f"Key '{key}' missing from patient data"

    # Test 2: GET /api/patients with search filter
    params = {"search": "admin"}
    response = requests.get(f"{BASE_URL}/api/patients", headers=headers, params=params, timeout=TIMEOUT)
    assert response.status_code == 200
    filtered_data = get_json_or_assert(response)
    assert isinstance(filtered_data, list)
    # If data exists, at least one patient matching search expected
    if filtered_data:
        for patient in filtered_data:
            patient_values = " ".join(str(value).lower() for value in patient.values())
            assert "admin" in patient_values, "Search filter 'admin' not found in patient data"

    # Test 3: GET /api/patients with pagination (page=1, limit=2)
    params = {"page": 1, "limit": 2}
    response = requests.get(f"{BASE_URL}/api/patients", headers=headers, params=params, timeout=TIMEOUT)
    assert response.status_code == 200
    paged_data = get_json_or_assert(response)
    assert isinstance(paged_data, list)
    assert len(paged_data) <= 2, "Returned more patients than limit"

    # Test 4: GET /api/patients with invalid page or limit (e.g., negative values)
    params = {"page": -1, "limit": -5}
    response = requests.get(f"{BASE_URL}/api/patients", headers=headers, params=params, timeout=TIMEOUT)
    # Accept either 200 with empty or partial list or proper error handling 4xx
    assert response.status_code in (200, 400), f"Expected 200 or 400, got {response.status_code}"

    # If 200, verify response format
    if response.status_code == 200:
        invalid_data = get_json_or_assert(response)
        assert isinstance(invalid_data, list)
    
    # Test 5: GET /api/patients with combined search & pagination
    params = {"search": "admin", "page": 1, "limit": 1}
    response = requests.get(f"{BASE_URL}/api/patients", headers=headers, params=params, timeout=TIMEOUT)
    assert response.status_code == 200
    combined_data = get_json_or_assert(response)
    assert isinstance(combined_data, list)
    assert len(combined_data) <= 1
    if combined_data:
        patient_values = " ".join(str(value).lower() for value in combined_data[0].values())
        assert "admin" in patient_values

test_patients_management_api_list_patients_endpoint()
