"""Password login for the single-account local installation.

Hosted deployments use Supabase Auth instead. No raw password or session token is stored.
"""

import base64
import hashlib
import hmac
import re
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import LOCAL_COOKIE, LOCAL_USER_ID
from app.db import get_session
from app.models import LocalAccount, LocalSession, utcnow

router = APIRouter(prefix="/api/local-auth", tags=["local-auth"])
SESSION_DAYS = 30
USERNAME_RE = re.compile(r"^[a-z0-9][a-z0-9_.-]{2,31}$")


class Credentials(BaseModel):
    username: str
    password: str


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return "scrypt$16384$" + base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(digest).decode()


def _verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, cost, encoded_salt, encoded_digest = stored.split("$")
        if algorithm != "scrypt" or cost != "16384":
            return False
        expected = base64.urlsafe_b64decode(encoded_digest)
        actual = hashlib.scrypt(password.encode(), salt=base64.urlsafe_b64decode(encoded_salt), n=16384, r=8, p=1)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _new_session(response: Response, session: Session) -> None:
    raw = secrets.token_urlsafe(32)
    session.add(LocalSession(token_hash=hashlib.sha256(raw.encode()).hexdigest(), user_id=LOCAL_USER_ID,
                             expires_at=utcnow() + timedelta(days=SESSION_DAYS)))
    session.commit()
    response.set_cookie(LOCAL_COOKIE, raw, max_age=SESSION_DAYS * 86400, httponly=True,
                        secure=False, samesite="strict", path="/")


@router.get("/session")
def status(request: Request, session: Session = Depends(get_session)):
    account = session.get(LocalAccount, LOCAL_USER_ID)
    raw = request.cookies.get(LOCAL_COOKIE)
    saved = session.get(LocalSession, hashlib.sha256(raw.encode()).hexdigest()) if raw else None
    signed_in = bool(account and saved and saved.user_id == LOCAL_USER_ID and saved.expires_at > utcnow())
    return {"authenticated": signed_in, "needs_setup": account is None,
            "username": account.username if signed_in else None}


@router.post("/setup", status_code=201)
def setup(body: Credentials, response: Response, session: Session = Depends(get_session)):
    if session.get(LocalAccount, LOCAL_USER_ID):
        raise HTTPException(409, "This local account is already set up. Sign in instead.")
    username = body.username.strip().lower()
    if not USERNAME_RE.fullmatch(username):
        raise HTTPException(422, "Username must be 3–32 characters: lowercase letters, numbers, dots, dashes or underscores.")
    if not 12 <= len(body.password) <= 128:
        raise HTTPException(422, "Use a password between 12 and 128 characters.")
    try:
        session.add(LocalAccount(id=LOCAL_USER_ID, username=username, password_hash=_hash_password(body.password)))
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(409, "This local account is already set up. Sign in instead.") from exc
    _new_session(response, session)
    return {"username": username}


@router.post("/login")
def login(body: Credentials, response: Response, session: Session = Depends(get_session)):
    account = session.get(LocalAccount, LOCAL_USER_ID)
    username = body.username.strip().lower()
    if not account or len(body.password) > 128 or not hmac.compare_digest(account.username, username) or not _verify_password(body.password, account.password_hash):
        raise HTTPException(401, "Incorrect username or password.")
    session.execute(delete(LocalSession).where(LocalSession.expires_at <= utcnow()))
    _new_session(response, session)
    return {"username": account.username}


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, session: Session = Depends(get_session)):
    raw = request.cookies.get(LOCAL_COOKIE)
    if raw:
        session.execute(delete(LocalSession).where(LocalSession.token_hash == hashlib.sha256(raw.encode()).hexdigest()))
        session.commit()
    response.delete_cookie(LOCAL_COOKIE, path="/", samesite="strict")
