"""Owner authentication routes — session cookie only, no tokens in JSON."""

from fastapi import APIRouter, Depends, HTTPException, Response

from lib.auth import (
    clear_session_cookie,
    create_session_token,
    session_owner,
    set_session_cookie,
    verify_password,
)
from lib.db import db
from models.auth import LoginRequest, Owner, SessionInfo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Owner)
async def login(payload: LoginRequest, response: Response):
    owner = await db.owners.find_one({"email": payload.email.lower()})
    if not owner or not verify_password(payload.password, owner.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    set_session_cookie(response, create_session_token(owner))
    return Owner(id=owner["id"], email=owner["email"])


@router.get("/me", response_model=SessionInfo)
async def me(owner: dict | None = Depends(session_owner)):
    """Answers 200 either way so an anonymous visitor never sees an error."""
    if not owner:
        return SessionInfo(authenticated=False)
    return SessionInfo(authenticated=True, owner=Owner(id=owner["id"], email=owner["email"]))


@router.post("/logout", status_code=204)
async def logout(response: Response):
    """Idempotent: clears the cookie whether or not the session was still valid."""
    clear_session_cookie(response)
    return None
