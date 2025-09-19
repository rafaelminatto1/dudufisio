import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("admin@clinicafisio.com.br", "AdminTeste123!")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_TC006_update_patient_endpoint():
    # Create a new patient to update
    create_payload = {
        "name": "Test Patient Update",
        "cpf": "12345678901",
        "email": "testupdatepatient@example.com",
        "phone": "+5511999999999",
        "birth_date": "1980-01-01"
    }
    patient_id = None
    try:
        create_response = requests.post(
            f"{BASE_URL}/api/patients",
            auth=AUTH,
            headers=HEADERS,
            json=create_payload,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 201, f"Failed to create patient: {create_response.text}"
        patient_id = create_response.json().get("id") or create_response.json().get("patient_id")
        assert patient_id is not None, "Created patient ID not returned"

        # Successful update payload
        update_payload = {
            "name": "Updated Patient Name",
            "cpf": "12345678901",
            "email": "updatedemail@example.com",
            "phone": "+5511888888888",
            "birth_date": "1980-01-01"
        }

        # Send PUT request to update patient data
        update_response = requests.put(
            f"{BASE_URL}/api/patients/{patient_id}",
            auth=AUTH,
            headers=HEADERS,
            json=update_payload,
            timeout=TIMEOUT
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        updated_data = update_response.json()
        assert updated_data["name"] == update_payload["name"]
        assert updated_data["email"] == update_payload["email"]
        assert updated_data["phone"] == update_payload["phone"]
        assert updated_data["cpf"] == update_payload["cpf"]
        assert updated_data.get("birth_date") == update_payload["birth_date"]

        # Test invalid update data: missing required field 'name'
        invalid_payload = {
            "cpf": "12345678901",
            "email": "invalidemail@example.com",
            "phone": "+5511777777777",
            "birth_date": "1980-01-01"
        }
        invalid_response = requests.put(
            f"{BASE_URL}/api/patients/{patient_id}",
            auth=AUTH,
            headers=HEADERS,
            json=invalid_payload,
            timeout=TIMEOUT
        )
        # Assuming API returns 400 Bad Request for invalid update data
        assert invalid_response.status_code >= 400 and invalid_response.status_code < 500, \
            f"Invalid update data not properly handled, status: {invalid_response.status_code}"

        # Test invalid CPF update (wrong format)
        invalid_cpf_payload = {
            "name": "Invalid CPF Patient",
            "cpf": "invalidcpf",
            "email": "invalidcpf@example.com",
            "phone": "+5511666666666",
            "birth_date": "1980-01-01"
        }
        invalid_cpf_response = requests.put(
            f"{BASE_URL}/api/patients/{patient_id}",
            auth=AUTH,
            headers=HEADERS,
            json=invalid_cpf_payload,
            timeout=TIMEOUT
        )
        assert invalid_cpf_response.status_code >= 400 and invalid_cpf_response.status_code < 500, \
            f"Invalid CPF not properly handled, status: {invalid_cpf_response.status_code}"

    finally:
        # Clean up: archive (soft delete) created patient
        if patient_id:
            requests.delete(
                f"{BASE_URL}/api/patients/{patient_id}",
                auth=AUTH,
                timeout=TIMEOUT
            )

test_TC006_update_patient_endpoint()
