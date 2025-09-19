import requests
import uuid

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
AUTH_PROFILE_URL = f"{BASE_URL}/api/auth/profile"
SESSION = requests.Session()
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

# Credentials for login
LOGIN_PAYLOAD = {
    "email": "admin@clinicafisio.com.br",
    "password": "AdminTeste123!"
}

def login_and_set_session():
    response = SESSION.post(
        LOGIN_URL,
        json=LOGIN_PAYLOAD,
        headers=HEADERS,
        timeout=TIMEOUT
    )
    assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"


def test_tc007_archive_patient_endpoint():
    login_and_set_session()

    patient_data = {
        "name": f"Test Patient {uuid.uuid4()}",
        "cpf": f"{uuid.uuid4().int % 100000000000 + 10000000000}",  # random numeric cpf-like string
        "email": f"test.patient.{uuid.uuid4()}@example.com",
        "phone": "1234567890",
        "birth_date": "1980-01-01"
    }
    patient_id = None

    try:
        # Create a new patient to archive
        response_create = SESSION.post(
            f"{BASE_URL}/api/patients",
            json=patient_data,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert response_create.status_code == 201, f"Failed to create patient: {response_create.text}"
        patient_id = response_create.json().get("id")
        assert patient_id, "Created patient response does not contain id"

        # Archive (soft delete) the patient with DELETE /api/patients/{id}
        response_delete = SESSION.delete(
            f"{BASE_URL}/api/patients/{patient_id}",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert response_delete.status_code == 200, f"Failed to archive patient: {response_delete.text}"

        # Verify the patient is no longer active by trying to GET the patient details
        response_get = SESSION.get(
            f"{BASE_URL}/api/patients/{patient_id}",
            headers=HEADERS,
            timeout=TIMEOUT,
        )

        # Handle common response patterns for archived patient
        if response_get.status_code == 404:
            # Patient not found, acceptable if archived patients are hidden
            pass
        elif response_get.status_code == 200:
            patient_detail = response_get.json()
            active = patient_detail.get("active", True)
            archived = patient_detail.get("archived", False)
            assert not active or archived, "Patient still active after archive"
        else:
            assert False, f"Unexpected GET response status after archive: {response_get.status_code} - {response_get.text}"
    finally:
        # Clean up: try to delete again in case patient was not archived properly
        if patient_id:
            try:
                SESSION.delete(
                    f"{BASE_URL}/api/patients/{patient_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT,
                )
            except Exception:
                pass

test_tc007_archive_patient_endpoint()
