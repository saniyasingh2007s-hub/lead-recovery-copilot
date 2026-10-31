"""Auth models — owner login over an httpOnly session cookie."""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class Owner(BaseModel):
    id: str
    email: str


class SessionInfo(BaseModel):
    """Always answers 200 so an anonymous visitor is not an error."""

    authenticated: bool
    owner: Optional[Owner] = None
