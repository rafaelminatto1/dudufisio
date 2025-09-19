import requests
from requests.auth import HTTPBasicAuth
import uuid

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("admin@clinicafisio.com.br", "AdminTeste123!")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_tc004_create_patient_endpoint():
    created_patient_ids = []
    try:
        # 1. Create a new patient with required fields (valid data)
        patient_data = {
            "name": "Test Patient " + str(uuid.uuid4()),
            "cpf": str(uuid.uuid4().int)[:11],  # use first 11 digits of UUID int to simulate CPF
            "email": f"testpatient{uuid.uuid4().hex[:8]}@example.com",
            "phone": "+5511999999999",
            "birth_date": "1990-01-01"
        }
        response = requests.post(
            f"{BASE_URL}/api/patients",
            json=patient_data,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        # Check if response has content before parsing JSON
        if response.content:
            patient_created = response.json()
        else:
            assert False, "Response body is empty"
        patient_id = patient_created.get("id")
        assert patient_id is not None, "Response missing patient id"
        created_patient_ids.append(patient_id)

        # 2. Attempt to create a patient with invalid CPF (simulate)
        invalid_cpf_data = patient_data.copy()
        invalid_cpf_data["cpf"] = "123"  # invalid CPF (too short)
        invalid_cpf_data["email"] = f"invalidcpf{uuid.uuid4().hex[:8]}@example.com"
        response_invalid_cpf = requests.post(
            f"{BASE_URL}/api/patients",
            json=invalid_cpf_data,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response_invalid_cpf.status_code >= 400, (
            f"Expected failure status code on invalid CPF, got {response_invalid_cpf.status_code}"
        )

        # 3. Attempt to create duplicate patient with same CPF (should fail)
        duplicate_cpf_data = patient_data.copy()
        duplicate_cpf_data["email"] = f"duplicate{uuid.uuid4().hex[:8]}@example.com"
        response_duplicate = requests.post(
            f"{BASE_URL}/api/patients",
            json=duplicate_cpf_data,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response_duplicate.status_code >= 400, (
            f"Expected failure status code on duplicate CPF, got {response_duplicate.status_code}"
        )

    finally:
        # Cleanup created patients to not leave test data
        for pid in created_patient_ids:
            try:
                requests.delete(
                    f"{BASE_URL}/api/patients/{pid}",
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_tc004_create_patient_endpoint()
