import requests
from datetime import datetime, timedelta
import uuid
import random

BASE_URL = "http://localhost:3000"
USERNAME = "admin@clinicafisio.com.br"
PASSWORD = "AdminTeste123!"
TIMEOUT = 30

def test_appointments_management_api_create_appointment():
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    session = requests.Session()

    # Step 0: Login to get authentication token or session cookie
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        headers=headers,
        json=login_payload,
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Failed to login: {login_resp.text}"

    auth_headers = headers.copy()
    token = None
    try:
        token = login_resp.json().get("token")
    except Exception:
        token = None
    if token:
        auth_headers["Authorization"] = f"Bearer {token}"

    # Helper function to post with proper auth
    def auth_post(url, json_payload):
        if token:
            return requests.post(url, headers=auth_headers, json=json_payload, timeout=TIMEOUT)
        else:
            return session.post(url, headers=auth_headers, json=json_payload, timeout=TIMEOUT)

    def auth_delete(url):
        if token:
            return requests.delete(url, headers=auth_headers, timeout=TIMEOUT)
        else:
            return session.delete(url, headers=auth_headers, timeout=TIMEOUT)

    # Generate random CPF 11 numeric digits
    def random_cpf():
        return ''.join(str(random.randint(0,9)) for _ in range(11))

    patient_payload = {
        "name": f"Test Patient {uuid.uuid4()}",
        "cpf": random_cpf(),  # Fake CPF as 11-digit string
        "email": f"testpatient_{uuid.uuid4()}@example.com",
        "phone": "11999999999",
        "birth_date": "1990-01-01"
    }
    patient_id = None
    appointment_id = None

    try:
        patient_resp = auth_post(
            f"{BASE_URL}/api/patients",
            patient_payload
        )
        assert patient_resp.status_code == 201, f"Failed to create patient: {patient_resp.text}"
        patient_id = patient_resp.json().get("id")
        assert patient_id, "Patient ID not returned in response"

        appointment_datetime = (datetime.utcnow() + timedelta(days=1)).replace(microsecond=0).isoformat() + "Z"
        appointment_payload = {
            "patient_id": patient_id,
            "appointment_date": appointment_datetime,
            "duration_minutes": 30,
            "notes": "Initial appointment via automated test"
        }

        appointment_resp = auth_post(
            f"{BASE_URL}/api/appointments",
            appointment_payload
        )
        assert appointment_resp.status_code == 201, f"Failed to create appointment: {appointment_resp.text}"
        appointment_created = appointment_resp.json()
        appointment_id = appointment_created.get("id")
        assert appointment_id, "Appointment ID not returned in response"

        conflict_payload = {
            "patient_id": patient_id,
            "appointment_date": appointment_datetime,
            "duration_minutes": 30,
            "notes": "Conflicting appointment"
        }
        conflict_resp = auth_post(
            f"{BASE_URL}/api/appointments",
            conflict_payload
        )
        assert conflict_resp.status_code in (400, 409), "Conflict prevention failed, appointment created on conflict"

        missing_patient_payload = {
            "appointment_date": (datetime.utcnow() + timedelta(days=2)).replace(microsecond=0).isoformat() + "Z"
        }
        missing_patient_resp = auth_post(
            f"{BASE_URL}/api/appointments",
            missing_patient_payload
        )
        assert missing_patient_resp.status_code == 400, "Missing required field patient_id should return 400 Bad Request"

        missing_date_payload = {
            "patient_id": patient_id
        }
        missing_date_resp = auth_post(
            f"{BASE_URL}/api/appointments",
            missing_date_payload
        )
        assert missing_date_resp.status_code == 400, "Missing required field appointment_date should return 400 Bad Request"

    finally:
        if appointment_id:
            auth_delete(f"{BASE_URL}/api/appointments/{appointment_id}")
        if patient_id:
            auth_delete(f"{BASE_URL}/api/patients/{patient_id}")


test_appointments_management_api_create_appointment()