"""Owner sessions: bcrypt password hashes + a signed JWT in an httpOnly cookie.

Tokens are never returned in a response body and never stored in the frontend —
the cookie rides same-origin fetches automatically.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request, Response
from passlib.context import CryptContext

from lib.db import db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_ALGORITHM = "HS256"
SESSION_COOKIE = "mlr_session"
SESSION_DAYS = 7


def _secret() -> str:
    return os.environ.get("JWT_SECRET", "mlr-dev-secret-change-me")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(password, password_hash)
    except Exception:
        return False


def create_session_token(owner: dict) -> str:
    payload = {
        "sub": owner["id"],
        "email": owner["email"],
        "exp": datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS),
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # works on both the http pod and the https preview
        max_age=SESSION_DAYS * 24 * 3600,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, path="/")


def _decode(request: Request) -> dict | None:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    try:
        return jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


async def session_owner(request: Request) -> dict | None:
    """The signed-in owner document, or None — never raises."""
    payload = _decode(request)
    if not payload:
        return None
    owner = await db.owners.find_one({"id": payload.get("sub")})
    if not owner:
        return None
    owner.pop("_id", None)
    owner.pop("password_hash", None)
    return owner


async def get_current_owner(request: Request) -> dict:
    """Dependency for every private route: 401 when there is no valid session."""
    owner = await session_owner(request)
    if not owner:
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    return owner
