"""Verify hosted Supabase identities or the local account session at the API boundary."""

from functools import lru_cache
from hashlib import sha256
from urllib.parse import urlparse
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_session
from app.models import LocalSession, utcnow

LOCAL_USER_ID = "local"
LOCAL_COOKIE = "apex_local_session"
bearer = HTTPBearer(auto_error=False)


def validate_hosted_settings() -> None:
    if settings.app_mode != "hosted":
        return
    supabase = urlparse(settings.supabase_url)
    public = urlparse(settings.public_origin)
    if supabase.scheme != "https" or not (supabase.hostname or "").endswith(".supabase.co") or supabase.path not in ("", "/"):
        raise RuntimeError("Hosted mode requires a Supabase HTTPS project URL")
    if public.scheme != "https" or not public.netloc or public.path or public.query or public.fragment:
        raise RuntimeError("Hosted mode requires a plain HTTPS PUBLIC_ORIGIN without a path")
    if not settings.database_url.startswith("postgresql+psycopg://"):
        raise RuntimeError("Hosted mode requires a psycopg PostgreSQL DATABASE_URL")
    if settings.auto_backup:
        raise RuntimeError("Hosted mode requires AUTO_BACKUP=false; use managed database backups")


@lru_cache(maxsize=1)
def _jwks() -> jwt.PyJWKClient:
    return jwt.PyJWKClient(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json",
        cache_jwk_set=True,
        lifespan=600,
        timeout=5,
    )


def verify_access_token(token: str) -> str:
    try:
        key = _jwks().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            key.key,
            algorithms=["ES256", "RS256"],
            audience=settings.supabase_jwt_audience,
            issuer=f"{settings.supabase_url.rstrip('/')}/auth/v1",
            options={"require": ["exp", "iat", "iss", "sub", "aud"]},
        )
        # Supabase Auth user subjects are UUIDs; reject API-key JWTs and malformed identities.
        user_id = str(UUID(claims["sub"]))
        if claims.get("role") != "authenticated":
            raise ValueError("not a student access token")
        return user_id
    except (jwt.PyJWTError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(401, "Invalid or expired session", headers={"WWW-Authenticate": "Bearer"}) from exc


def optional_student(request: Request, session: Session = Depends(get_session), credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str | None:
    if settings.app_mode == "local":
        token = request.cookies.get(LOCAL_COOKIE)
        if not token:
            return None
        saved = session.get(LocalSession, sha256(token.encode()).hexdigest())
        return saved.user_id if saved and saved.expires_at > utcnow() else None
    if credentials is None:
        return None
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Bearer token required")
    return verify_access_token(credentials.credentials)


def require_student(user_id: str | None = Depends(optional_student)) -> str:
    if user_id is None:
        raise HTTPException(401, "Sign in to save your progress", headers={"WWW-Authenticate": "Bearer"})
    return user_id
