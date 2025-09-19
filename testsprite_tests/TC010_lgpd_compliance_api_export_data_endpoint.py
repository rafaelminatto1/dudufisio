import requests

BASE_URL = "http://localhost:3000"
LOGIN_EMAIL = "admin@clinicafisio.com.br"
LOGIN_PASSWORD = "AdminTeste123!"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_lgpd_export_personal_data_endpoint():
    session = requests.Session()

    # Step 0: Authenticate by logging in and saving cookies/session
    login_payload = {
        "email": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD
    }
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        headers=HEADERS,
        json=login_payload,
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"

    # Step 1: Create a new patient to have a valid patient_id
    patient_payload = {
        "name": "Test User LGPD Export",
        "cpf": "12345678909",
        "email": "testlgpdexport@example.com",
        "phone": "11999999999",
        # birth_date is optional in schema, so omitted here
    }
    patient_id = None
    try:
        create_resp = session.post(
            f"{BASE_URL}/api/patients",
            headers=HEADERS,
            json=patient_payload,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Failed to create patient: {create_resp.text}"
        patient_id = create_resp.json().get("id")
        assert patient_id is not None, "Created patient response missing id"

        # Step 2: Test export in all supported formats for valid patient_id
        for export_format in ["json", "csv", "pdf"]:
            export_payload = {
                "patient_id": patient_id,
                "format": export_format
            }
            export_resp = session.post(
                f"{BASE_URL}/api/lgpd/export",
                headers=HEADERS,
                json=export_payload,
                timeout=TIMEOUT
            )
            assert export_resp.status_code == 200, f"Export failed for format {export_format}: {export_resp.text}"
            # Basic content validation depending on format
            if export_format == "json":
                response_json = export_resp.json()
                assert isinstance(response_json, dict), "JSON export response is not a dict"
                assert "patient_id" in response_json or "data" in response_json, "JSON export missing expected keys"
            else:
                content_type = export_resp.headers.get("Content-Type", "")
                if export_format == "csv":
                    assert "text/csv" in content_type or export_resp.content.startswith(b"\ufeff") or b"," in export_resp.content, "CSV export response invalid"
                elif export_format == "pdf":
                    assert content_type == "application/pdf" or export_resp.content[:4] == b"%PDF", "PDF export response invalid"

        # Step 3: Test missing patient_id field in request body
        invalid_payload = {
            # no patient_id
            "format": "json"
        }
        resp_missing_id = session.post(
            f"{BASE_URL}/api/lgpd/export",
            headers=HEADERS,
            json=invalid_payload,
            timeout=TIMEOUT
        )
        assert resp_missing_id.status_code >= 400, "Expected client error for missing patient_id"
        # Optionally check error message
        try:
            err_json = resp_missing_id.json()
            assert any(keyword in str(err_json).lower() for keyword in ["patient_id", "required", "missing"]), "Error message should indicate missing patient_id"
        except Exception:
            pass  # Non-JSON error response is also acceptable

        # Step 4: Test invalid patient_id value (random UUID-like string)
        invalid_patient_id = "00000000-0000-0000-0000-000000000000"
        invalid_id_payload = {
            "patient_id": invalid_patient_id,
            "format": "json"
        }
        resp_invalid_id = session.post(
            f"{BASE_URL}/api/lgpd/export",
            headers=HEADERS,
            json=invalid_id_payload,
            timeout=TIMEOUT
        )
        # The system could respond with 4xx or 200 but empty content; we assert error or empty result
        if resp_invalid_id.status_code == 200:
            try:
                content = resp_invalid_id.json()
                # Expect empty or no patient data for invalid id
                assert not content or "patient_id" not in content, "Expected no data for invalid patient_id"
            except Exception:
                assert False, "Expected JSON response for invalid patient_id"
        else:
            assert resp_invalid_id.status_code >= 400, "Expected client error for invalid patient_id"

    finally:
        # Clean up: Delete patient if created
        if patient_id:
            delete_resp = session.delete(
                f"{BASE_URL}/api/patients/{patient_id}",
                headers=HEADERS,
                timeout=TIMEOUT
            )
            # 200 expected for successful archive (soft delete)
            assert delete_resp.status_code == 200, f"Failed to delete test patient: {delete_resp.text}"


test_lgpd_export_personal_data_endpoint()