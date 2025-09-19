import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("admin@clinicafisio.com.br", "AdminTeste123!")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_get_patient_details():
    patient_id = None
    try:
        # Step 1: Create a new patient to get a valid patient ID
        unique_uuid_str = str(uuid.uuid4().int)
        cpf_digits = unique_uuid_str[-11:].rjust(11, '0')  # ensure 11 digits
        patient_data = {
            "name": f"Test Patient {uuid.uuid4()}",
            "cpf": cpf_digits,  # unique cpf with exactly 11 digits
            "email": f"testpatient{uuid.uuid4()}@example.com",
            "phone": "99999999999",
            "birth_date": "1990-01-01"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/patients",
            json=patient_data,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 201, f"Patient creation failed with status {create_response.status_code}"
        created_patient = create_response.json()
        patient_id = created_patient.get("id")
        assert patient_id, "Created patient ID not returned in response"

        # Step 2: Retrieve patient details with the created ID
        get_response = requests.get(
            f"{BASE_URL}/api/patients/{patient_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_response.status_code == 200, f"Failed to get patient details, status {get_response.status_code}"
        patient_details = get_response.json()

        # Validate returned patient details contain expected fields
        expected_fields = {"id", "name", "cpf", "email", "phone"}
        missing_fields = expected_fields - patient_details.keys()
        assert not missing_fields, f"Missing fields in patient details response: {missing_fields}"

        # Validate returned fields match created data (except birth_date may or may not be returned)
        assert patient_details["id"] == patient_id
        assert patient_details["name"] == patient_data["name"]
        assert patient_details["cpf"] == patient_data["cpf"]
        assert patient_details["email"] == patient_data["email"]
        assert patient_details["phone"] == patient_data["phone"]

    finally:
        # Cleanup: Delete (archive) the created patient
        if patient_id:
            delete_response = requests.delete(
                f"{BASE_URL}/api/patients/{patient_id}",
                auth=AUTH,
                headers=HEADERS,
                timeout=TIMEOUT
            )
            assert delete_response.status_code == 200, f"Failed to delete test patient, status {delete_response.status_code}"

test_get_patient_details()