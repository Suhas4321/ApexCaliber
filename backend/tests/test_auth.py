from datetime import datetime, timedelta, timezone
import json
import os
import subprocess
import sys
from pathlib import Path
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException

from app import auth
from app.config import settings


def test_signed_student_token_requires_valid_signature_and_claims(monkeypatch):
    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(private.public_key()))
    public_jwk.update({"kid": "test-key", "alg": "RS256", "use": "sig"})
    jwks = jwt.PyJWKClient("https://example.invalid/jwks", cache_jwk_set=False)
    monkeypatch.setattr(jwks, "fetch_data", lambda: {"keys": [public_jwk]})
    monkeypatch.setattr(auth, "_jwks", lambda: jwks)
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")

    user_id = str(uuid4())
    claims = {
        "sub": user_id, "role": "authenticated", "aud": "authenticated",
        "iss": "https://example.supabase.co/auth/v1",
        "iat": datetime.now(timezone.utc), "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    token = jwt.encode(claims, private, algorithm="RS256", headers={"kid": "test-key"})
    assert auth.verify_access_token(token) == user_id

    for changed in ({"aud": "other"}, {"role": "service_role"}, {"exp": datetime.now(timezone.utc) - timedelta(minutes=1)}):
        bad = jwt.encode({**claims, **changed}, private, algorithm="RS256", headers={"kid": "test-key"})
        with pytest.raises(HTTPException) as exc:
            auth.verify_access_token(bad)
        assert exc.value.status_code == 401

    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    forged = jwt.encode(claims, other_key, algorithm="RS256", headers={"kid": "test-key"})
    with pytest.raises(HTTPException):
        auth.verify_access_token(forged)


def test_hosted_mode_rejects_local_storage_and_missing_configuration(monkeypatch):
    monkeypatch.setattr(settings, "app_mode", "hosted")
    with pytest.raises(RuntimeError):
        auth.validate_hosted_settings()
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(settings, "public_origin", "https://learn.example.com")
    monkeypatch.setattr(settings, "auto_backup", False)
    with pytest.raises(RuntimeError, match="PostgreSQL"):
        auth.validate_hosted_settings()
    monkeypatch.setattr(settings, "database_url", "postgresql+psycopg://test:test@localhost/test")
    auth.validate_hosted_settings()


def test_hosted_app_does_not_mount_backup_routes():
    env = os.environ.copy()
    env.update(APP_MODE="hosted", AUTO_BACKUP="false")
    result = subprocess.run(
        [sys.executable, "-c", "from app.main import app; print(any(p.startswith('/api/backup') for p in app.openapi()['paths']))"],
        cwd=Path(__file__).resolve().parents[1], env=env, capture_output=True, text=True, check=True,
    )
    assert result.stdout.strip() == "False"
