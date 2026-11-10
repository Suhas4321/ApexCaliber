from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models import LocalAccount


def test_local_account_requires_a_session_and_stores_only_a_hash(client):
    # The shared test fixture completes first-time setup, preserving the local learner id.
    with SessionLocal() as session:
        account = session.get(LocalAccount, "local")
        assert account.username == "test-student"
        assert account.password_hash.startswith("scrypt$")
        assert "test-password-for-local-auth" not in account.password_hash

    guest = TestClient(app)
    assert guest.get("/api/local-auth/session").json() == {
        "authenticated": False, "needs_setup": False, "username": None,
    }
    assert guest.patch("/api/questions/two-sum/progress", json={"concept_done": True}).status_code == 401
    assert guest.post("/api/backup/dump").status_code == 401
    assert guest.post("/api/playground/run", json={"code": "pass", "function_name": "f"}).status_code == 401
    assert guest.post("/api/local-auth/setup", json={"username": "other", "password": "another-password-long"}).status_code == 409
    assert guest.post("/api/local-auth/login", json={"username": "test-student", "password": "wrong"}).status_code == 401

    response = guest.post("/api/local-auth/login", json={"username": "test-student", "password": "test-password-for-local-auth"})
    assert response.status_code == 200
    assert "httponly" in response.headers["set-cookie"].lower()
    assert "samesite=strict" in response.headers["set-cookie"].lower()
    assert guest.get("/api/local-auth/session").json()["authenticated"] is True
    assert guest.post("/api/local-auth/logout").status_code == 204
    assert guest.get("/api/local-auth/session").json()["authenticated"] is False
    assert guest.patch("/api/questions/two-sum/progress", json={"concept_done": True}).status_code == 401
