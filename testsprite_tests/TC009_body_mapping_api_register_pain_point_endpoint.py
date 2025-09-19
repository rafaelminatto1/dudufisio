import requests
import uuid
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("admin@clinicafisio.com.br", "AdminTeste123!")
TIMEOUT = 30
HEADERS_JSON = {"Content-Type": "application/json"}

def test_body_mapping_api_register_pain_point():
    session_id = None
    try:
        # Step 1: Create a new patient (required to create a session)
        patient_data = {
            "name": f"Test Patient {uuid.uuid4()}",
            "cpf": str(uuid.uuid4())[:11],  # Simplistic random CPF
            "email": f"test{uuid.uuid4()}@example.com",
            "phone": "1234567890",
            "birth_date": "1980-01-01"
        }
        res_patient = requests.post(
            f"{BASE_URL}/api/patients",
            json=patient_data,
            auth=AUTH,
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert res_patient.status_code == 201, f"Patient creation failed: {res_patient.text}"
        patient_id = res_patient.json().get("id")
        assert patient_id, "Patient ID not returned"

        # Step 2: Create a new session for that patient
        session_data = {
            "patient_id": patient_id,
            "session_type": "avaliacao",
            "session_date": "2025-09-14T10:00:00Z"
        }
        res_session = requests.post(
            f"{BASE_URL}/api/sessions",
            json=session_data,
            auth=AUTH,
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert res_session.status_code == 201, f"Session creation failed: {res_session.text}"
        session_id = res_session.json().get("id")
        assert session_id, "Session ID not returned"

        # Step 3: Register a valid pain point with required fields and valid intensity range (0-10)
        pain_point_data = {
            "body_region": "Lower Back",
            "pain_intensity": 7,
            "coordinates": {"x": 100, "y": 200},
            "notes": "Sharp pain after exercise"
        }
        res_pain_point = requests.post(
            f"{BASE_URL}/api/sessions/{session_id}/pain-points",
            json=pain_point_data,
            auth=AUTH,
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert res_pain_point.status_code == 201, f"Pain point creation failed: {res_pain_point.text}"
        pain_point_response = res_pain_point.json()
        assert pain_point_response.get("body_region") == pain_point_data["body_region"]
        assert pain_point_response.get("pain_intensity") == pain_point_data["pain_intensity"]

        # Step 4: Test error case for invalid pain_intensity (less than 0)
        invalid_pain_point_low = {
            "body_region": "Upper Back",
            "pain_intensity": -1
        }
        res_invalid_low = requests.post(
            f"{BASE_URL}/api/sessions/{session_id}/pain-points",
            json=invalid_pain_point_low,
            auth=AUTH,
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert res_invalid_low.status_code >= 400, "Expected client error for pain_intensity < 0"

        # Step 5: Test error case for invalid pain_intensity (greater than 10)
        invalid_pain_point_high = {
            "body_region": "Neck",
            "pain_intensity": 11
        }
        res_invalid_high = requests.post(
            f"{BASE_URL}/api/sessions/{session_id}/pain-points",
            json=invalid_pain_point_high,
            auth=AUTH,
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert res_invalid_high.status_code >= 400, "Expected client error for pain_intensity > 10"

        # Step 6: Test error case for missing required body_region
        missing_body_region = {
            "pain_intensity": 5
        }
        res_missing_body = requests.post(
            f"{BASE_URL}/api/sessions/{session_id}/pain-points",
            json=missing_body_region,
            auth=AUTH,
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert res_missing_body.status_code >= 400, "Expected client error for missing body_region"

        # Step 7: Test error case for missing required pain_intensity
        missing_pain_intensity = {
            "body_region": "Left Knee"
        }
        res_missing_intensity = requests.post(
            f"{BASE_URL}/api/sessions/{session_id}/pain-points",
            json=missing_pain_intensity,
            auth=AUTH,
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        assert res_missing_intensity.status_code >= 400, "Expected client error for missing pain_intensity"

    finally:
        # Cleanup: Delete created session and patient if exist
        if session_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/sessions/{session_id}",
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass
        if 'patient_id' in locals():
            try:
                requests.delete(
                    f"{BASE_URL}/api/patients/{patient_id}",
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_body_mapping_api_register_pain_point()